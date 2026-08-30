"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar";

type TabName =
  | "Overview"
  | "Calendar"
  | "Campaigns"
  | "AI Copy"
  | "Channels"
  | "SEO"
  | "Segments"
  | "Analytics";

interface ToastState {
  show: boolean;
  message: string;
}

interface CalendarEvent {
  day: number;
  title: string;
  type: "paid" | "organic" | "email" | "content";
}

interface Campaign {
  name: string;
  objective: string;
  budget: string;
  status: "Live" | "Draft";
  conv: string;
}

interface ChannelCard {
  title: string;
  metric: string;
  status: "Active" | "Testing" | "Not started";
  feedback: string;
}

interface SeoKeyword {
  keyword: string;
  volume: string;
  difficulty: "Low" | "Medium" | "High";
  rank: string;
}

interface SegmentCard {
  title: string;
  tags: string[];
  estSize: string;
  persona: string;
}

interface CacChannel {
  name: string;
  cost: string;
  percentage: number;
  barColor: string;
}

interface LeaderboardItem {
  name: string;
  clicks: string;
  convs: string;
  cac: string;
}

export default function MarketingHub() {
  const [activeTab, setActiveTab] = useState<TabName>("Analytics");
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 6, 1)); // July 2026

  // AI Copy Generator State
  const [assetType, setAssetType] = useState<string>("Social post");
  const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState<boolean>(false);
  
  const [channel, setChannel] = useState<string>("WhatsApp");
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState<boolean>(false);

  const [selectedTone, setSelectedTone] = useState<string>("Friendly");
  const [keyMessage, setKeyMessage] = useState<string>("Saving should be effortless, even on irregular income");
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);

  const assetTypes = ["Social post", "Ad", "Email", "Landing headline"];
  const channels = ["WhatsApp", "Instagram", "X", "Email"];
  const tones = ["Bold", "Friendly", "Expert", "Playful"];

  // Campaigns Data
  const campaignsList: Campaign[] = [
    { name: "WhatsApp waitlist push", objective: "Leads", budget: "₦120K", status: "Live", conv: "9.0%" },
    { name: "Agent referral drive", objective: "Leads", budget: "₦80K", status: "Live", conv: "12.4%" },
    { name: "Launch teaser", objective: "Awareness", budget: "₦200K", status: "Draft", conv: "not live" },
  ];

  // Channels Data
  const channelsList: ChannelCard[] = [
    {
      title: "Organic social",
      metric: "4.2K reach / mo",
      status: "Active",
      feedback: "Good fit: your audience lives on WhatsApp and Instagram.",
    },
    {
      title: "Referral",
      metric: "₦180 CAC, best channel",
      status: "Active",
      feedback: "High fit: agents already have trust with your users.",
    },
    {
      title: "Paid social",
      metric: "₦640 CAC",
      status: "Testing",
      feedback: "Medium fit: works, but referral is cheaper for now.",
    },
    {
      title: "Content / SEO",
      metric: "Ranking 3 keywords",
      status: "Testing",
      feedback: "High fit: buyers research saving heavily, SEO compounds.",
    },
    {
      title: "Email",
      metric: "38% open rate",
      status: "Active",
      feedback: "Good fit: nurtures your waitlist toward launch.",
    },
    {
      title: "Events",
      metric: "No activity yet",
      status: "Not started",
      feedback: "Low fit for now: revisit at the launch stage.",
    },
  ];

  // SEO Keywords Data
  const seoKeywordsList: SeoKeyword[] = [
    { keyword: "how to save money as a gig worker", volume: "2.4K", difficulty: "Low", rank: "#4" },
    { keyword: "automatic savings app nigeria", volume: "1.1K", difficulty: "Medium", rank: "#9" },
    { keyword: "ajo vs savings app", volume: "600", difficulty: "Low", rank: "#2" },
    { keyword: "best savings app for traders", volume: "900", difficulty: "Medium", rank: "#14" },
  ];

  // Audience Segments Data
  const segmentsList: SegmentCard[] = [
    {
      title: "Okada & delivery riders",
      tags: ["Daily cash income", "Age 22 to 35"],
      estSize: "~1.8M",
      persona: "Chidi",
    },
    {
      title: "Market traders",
      tags: ["Weekly cash flow", "Uses ajo"],
      estSize: "~2.4M",
      persona: "Funke",
    },
    {
      title: "App-based gig workers",
      tags: ["Digital-first", "Wants investing"],
      estSize: "~900K",
      persona: "Yaw",
    },
  ];

  // Analytics CAC Data matching the design
  const cacChannelsList: CacChannel[] = [
    { name: "Referral", cost: "₦180", percentage: 38, barColor: "bg-[#1e4836]" },
    { name: "Organic", cost: "₦260", percentage: 55, barColor: "bg-[#1e4836]" },
    { name: "Email", cost: "₦310", percentage: 70, barColor: "bg-[#46735e]" },
    { name: "Paid", cost: "₦640", percentage: 95, barColor: "bg-[#9c7d3d]" },
  ];

  // Campaign Leaderboard Data matching the design
  const leaderboardList: LeaderboardItem[] = [
    { name: "Agent referral drive", clicks: "1,920 clicks", convs: "238 conv", cac: "₦180 CAC" },
    { name: "WhatsApp waitlist push", clicks: "2,410 clicks", convs: "217 conv", cac: "₦240 CAC" },
    { name: "Launch teaser", clicks: "640 clicks", convs: "31 conv", cac: "₦520 CAC" },
  ];

  // Preset events for July 2026
  const julyEvents: Record<number, CalendarEvent[]> = {
    1: [{ day: 1, title: "WhatsApp: ajo story", type: "organic" }],
    3: [{ day: 3, title: "Email: waitlist", type: "email" }],
    7: [{ day: 7, title: "Paid: signups", type: "paid" }],
    9: [{ day: 9, title: "Blog: saving tips", type: "content" }],
    14: [{ day: 14, title: "WhatsApp: referral", type: "organic" }],
    16: [{ day: 16, title: "Paid: retarget", type: "paid" }],
    21: [{ day: 21, title: "Email: update", type: "email" }],
  };

  const showToastMsg = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3500);
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#2c3531] flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0e271f] text-white flex-shrink-0 hidden md:block shadow-lg">
        <Sidebar />
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 w-full md:pl-64">
        
        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-[#0e271f] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#1f4236]">
              <span className="text-emerald-400 font-bold text-sm">✓</span>
              <span className="font-medium text-sm tracking-wide text-gray-100">
                {toast.message}
              </span>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-green-100 shadow-card w-full">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-sage-500">
              <span className="hover:text-sage-700 cursor-pointer">Workspace</span>
              <span>/</span>
              <span className="font-semibold text-sage-900">Marketing Hub</span>
            </div>

            <div className="flex items-center gap-2 md:gap-3 ml-auto">
              <div className="bg-green-100 text-green-900 px-3 py-1 md:px-3.5 md:py-1.5 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 border border-green-200">
                <span>Health</span>
                <span className="font-display font-bold text-sm md:text-base text-green-900">
                  72
                </span>
                <span className="text-xs">↑</span>
              </div>

              <button
                aria-label="Notifications"
                className="relative p-2.5 rounded-full bg-gray-100/80 border border-gray-200/60 text-gray-700 hover:bg-gray-200/60 transition-colors flex items-center justify-center cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#b89d5f] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="bg-copper-600 hover:bg-copper-700 text-white font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-card text-xs md:text-sm transition-colors flex items-center gap-1">
                <span>+ Invite</span>
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3 pt-1">
            <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {(
                [
                  "Overview",
                  "Calendar",
                  "Campaigns",
                  "AI Copy",
                  "Channels",
                  "SEO",
                  "Segments",
                  "Analytics",
                ] as TabName[]
              ).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab !== "AI Copy") setHasGenerated(false);
                    }}
                    className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-copper-200 text-copper-700 shadow-card font-semibold"
                        : "bg-sage-100 text-sage-700 hover:bg-green-100"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 flex-1 w-full space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                  Marketing Hub
                </h1>
                <p className="text-gray-500 text-sm sm:text-base">
                  Plan it, write it, ship it, measure it.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                    SCHEDULED THIS WEEK
                  </span>
                  <div className="text-3xl font-serif font-bold text-gray-900">6</div>
                  <p className="text-xs text-gray-500">posts across 3 channels</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                    ACTIVE CAMPAIGNS
                  </span>
                  <div className="text-3xl font-serif font-bold text-gray-900">2</div>
                  <p className="text-xs text-gray-500">WhatsApp + referral</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                    TOP CHANNEL
                  </span>
                  <div className="text-3xl font-serif font-bold text-gray-900">Referral</div>
                  <p className="text-xs text-gray-500">by conversions</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                    AI CONTENT IDEAS
                  </span>
                  <div className="text-3xl font-serif font-bold text-gray-900">4</div>
                  <p className="text-xs text-gray-500">waiting for you</p>
                </div>
              </div>

              <div className="bg-[#0e271f] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#b89d5f] text-[#1c180e] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                    ✦
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-semibold text-lg text-gray-100">
                      This week's idea
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      A short WhatsApp thread on “the ajo box problem” would fit your audience and your trust theme.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab("AI Copy");
                    setHasGenerated(false);
                  }}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer whitespace-nowrap shadow-xs"
                >
                  Draft it
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CALENDAR */}
          {activeTab === "Calendar" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                    Content calendar
                  </h1>
                  <div className="flex items-center gap-3 pt-1">
                    <button 
                      onClick={prevMonth}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2 py-1 rounded bg-gray-200/60 cursor-pointer"
                    >
                      ← Prev
                    </button>
                    <span className="text-gray-600 font-medium text-sm">
                      {monthNames[month]} {year}
                    </span>
                    <button 
                      onClick={nextMonth}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2 py-1 rounded bg-gray-200/60 cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => showToastMsg("AI proposed a 7-day starter calendar.")}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-xs flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>✦</span>
                  <span>Plan my first week</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600 pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9c7d3d]"></span>
                  <span className="font-medium">Paid social</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0e271f]"></span>
                  <span className="font-medium">Organic</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e4836]"></span>
                  <span className="font-medium">Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#46735e]"></span>
                  <span className="font-medium">Content</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-200 text-center text-xs font-bold text-gray-500 uppercase tracking-wider py-3">
                  <span>SUN</span>
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                  <span>SAT</span>
                </div>

                <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-100">
                  {Array.from({ length: firstDayIndex }).map((_, index) => (
                    <div key={`empty-${index}`} className="min-h-[110px] bg-gray-50/30 p-2 opacity-40"></div>
                  ))}

                  {Array.from({ length: totalDays }).map((_, index) => {
                    const dayNum = index + 1;
                    const dayEvents = (year === 2026 && month === 6) ? julyEvents[dayNum] : [];

                    return (
                      <div
                        key={dayNum}
                        className="min-h-[115px] p-2 bg-white flex flex-col justify-between hover:bg-gray-50/50 transition-colors"
                      >
                        <span className="text-xs font-semibold text-gray-700">{dayNum}</span>
                        
                        <div className="space-y-1 mt-1 flex-1">
                          {dayEvents && dayEvents.map((evt, eIdx) => {
                            let badgeColor = "bg-[#0e271f] text-white";
                            if (evt.type === "paid") badgeColor = "bg-[#9c7d3d] text-white";
                            if (evt.type === "content") badgeColor = "bg-[#46735e] text-white";

                            return (
                              <div
                                key={eIdx}
                                className={`text-[11px] font-medium px-2 py-1 rounded-md truncate shadow-2xs ${badgeColor}`}
                              >
                                {evt.title}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMPAIGNS */}
          {activeTab === "Campaigns" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                    Campaigns
                  </h1>
                </div>

                <button
                  onClick={() => showToastMsg("New campaign wizard opened.")}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-xs flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>+ New campaign</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Campaign</th>
                        <th className="py-3.5 px-6">Objective</th>
                        <th className="py-3.5 px-6">Budget</th>
                        <th className="py-3.5 px-6">Status</th>
                        <th className="py-3.5 px-6">Conv.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {campaignsList.map((camp, idx) => {
                        const isLive = camp.status === "Live";
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-gray-900">{camp.name}</td>
                            <td className="py-4 px-6 text-gray-600">{camp.objective}</td>
                            <td className="py-4 px-6 text-gray-900 font-medium">{camp.budget}</td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  isLive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {camp.status}
                              </span>
                            </td>
                            <td className={`py-4 px-6 font-semibold ${isLive ? "text-emerald-700" : "text-gray-400"}`}>
                              {camp.conv}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#0e271f] rounded-2xl p-5 sm:p-6 flex items-center gap-4 text-white shadow-md">
                <div className="w-9 h-9 rounded-xl bg-[#b89d5f] text-[#1c180e] flex items-center justify-center font-bold flex-shrink-0">
                  ✦
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                  Weekly readout: WhatsApp referral is your cheapest conversion at ₦180 CAC. Consider shifting budget there.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: AI COPY GENERATOR */}
          {activeTab === "AI Copy" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                  AI copy generator
                </h1>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  
                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Asset type
                    </label>
                    <div
                      onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:border-gray-400"
                    >
                      <span className="text-gray-900">{assetType}</span>
                      <span className="text-gray-500 text-xs">▼</span>
                    </div>

                    {isAssetDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                        {assetTypes.map((type) => (
                          <div
                            key={type}
                            onClick={() => {
                              setAssetType(type);
                              setIsAssetDropdownOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-100 ${
                              assetType === type ? "bg-gray-200/60 font-semibold text-[#0e271f]" : "text-gray-700"
                            }`}
                          >
                            {type}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Channel
                    </label>
                    <div
                      onClick={() => setIsChannelDropdownOpen(!isChannelDropdownOpen)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:border-gray-400"
                    >
                      <span className="text-gray-900">{channel}</span>
                      <span className="text-gray-500 text-xs">▼</span>
                    </div>

                    {isChannelDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                        {channels.map((ch) => (
                          <div
                            key={ch}
                            onClick={() => {
                              setChannel(ch);
                              setIsChannelDropdownOpen(false);
                            }}
                            className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-100 ${
                              channel === ch ? "bg-gray-200/60 font-semibold text-[#0e271f]" : "text-gray-700"
                            }`}
                          >
                            {ch}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Tone
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {tones.map((tone) => {
                      const isSelected = selectedTone === tone;
                      return (
                        <button
                          key={tone}
                          type="button"
                          onClick={() => setSelectedTone(tone)}
                          className={`px-5 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#0e271f] text-white shadow-xs"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {tone}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Key message
                  </label>
                  <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
                    <input
                      type="text"
                      value={keyMessage}
                      onChange={(e) => setKeyMessage(e.target.value)}
                      className="w-full px-4 py-3 bg-transparent text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      setHasGenerated(true);
                      showToastMsg("AI Copy generated successfully!");
                    }}
                    className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-6 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-xs"
                  >
                    Generate copy
                  </button>
                </div>
              </div>

              {hasGenerated && (
                <div className="space-y-4 animate-fadeIn pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ship two. Let the audience pick the winner.
                  </p>

                  {[
                    "Your money disappears before the weekend? Kolo saves a little from every job, automatically. No bank, no willpower needed.",
                    "The ajo box is not safe, and you know it. Kolo keeps your savings locked, growing, and one tap away. Join the waitlist.",
                    "Save without thinking about it. Kolo rounds up every ride and delivery into savings that actually add up. Early access open now.",
                  ].map((copyText, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs space-y-4"
                    >
                      <p className="text-gray-900 text-sm sm:text-base leading-relaxed">
                        {copyText}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 pt-2">
                        <button
                          onClick={() => showToastMsg("Copy selected & applied!")}
                          className="bg-[#0e271f] hover:bg-[#15382d] text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => showToastMsg("Refining options with AI...")}
                          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Refine
                        </button>
                        <button
                          onClick={() => showToastMsg("Saved to calendar!")}
                          className="text-[#0e271f] hover:underline font-semibold text-xs cursor-pointer ml-auto"
                        >
                          Save to calendar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CHANNELS */}
          {activeTab === "Channels" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                  Channels
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {channelsList.map((ch, idx) => {
                  let badgeStyle = "bg-emerald-100 text-emerald-800";
                  if (ch.status === "Testing") badgeStyle = "bg-amber-100 text-amber-800";
                  if (ch.status === "Not started") badgeStyle = "bg-gray-100 text-gray-600";

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:border-gray-300 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif font-semibold text-lg text-gray-900">{ch.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeStyle}`}>
                            {ch.status}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-gray-500">{ch.metric}</p>
                      </div>

                      <div className="bg-[#f2f6f4] rounded-xl p-3.5 flex items-start gap-3 border border-[#e4ece7]">
                        <div className="w-5 h-5 rounded-md bg-[#b89d5f] text-[#1c180e] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                          ✦
                        </div>
                        <p className="text-xs sm:text-sm text-[#1e382c] font-medium leading-relaxed">
                          {ch.feedback}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: SEO TOOLS */}
          {activeTab === "SEO" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                  SEO tools
                </h1>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Keyword</th>
                        <th className="py-3.5 px-6">Volume</th>
                        <th className="py-3.5 px-6">Difficulty</th>
                        <th className="py-3.5 px-6">Rank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {seoKeywordsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-gray-900">{item.keyword}</td>
                          <td className="py-4 px-6 text-gray-600">{item.volume}</td>
                          <td className="py-4 px-6 text-gray-600">{item.difficulty}</td>
                          <td className="py-4 px-6 font-bold text-emerald-700">{item.rank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Brand positioning statement
                </h3>
                <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
                  For <span className="font-semibold text-emerald-900">gig workers in West Africa</span> who <span className="font-semibold text-emerald-900">struggle to save on irregular income</span>, <span className="font-semibold text-emerald-900">Kolo</span> is the <span className="font-semibold text-emerald-900">savings app</span> that <span className="font-semibold text-emerald-900">saves for you automatically, without a bank.</span>
                </p>
              </div>
            </div>
          )}

          {/* TAB 7: SEGMENTS */}
          {activeTab === "Segments" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                    Audience segments
                  </h1>
                </div>

                <button
                  onClick={() => showToastMsg("New segment builder opened.")}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-xs flex items-center gap-2 self-start sm:self-auto"
                >
                  <span>+ New segment</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {segmentsList.map((seg, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-6 hover:border-gray-300 transition-all"
                  >
                    <div className="space-y-3">
                      <h3 className="font-serif font-semibold text-lg text-gray-900">{seg.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        {seg.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 rounded-full text-xs font-medium border border-[#d2e2d8]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 font-medium">
                      Est. size <span className="text-gray-900 font-semibold">{seg.estSize}</span> · Persona <span className="text-gray-900 font-semibold">{seg.persona}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: PERFORMANCE ANALYTICS (NEW SPECIFICATION) */}
          {activeTab === "Analytics" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="text-3xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                  Performance analytics
                </h1>
              </div>

              {/* TOP GRAPHS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* TRAFFIC BY WEEK CARD */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-6">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Traffic by week
                  </h3>
                  
                  {/* SVG Line Graph matching design */}
                  <div className="h-44 w-full flex items-center justify-center pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 140" fill="none">
                      <path
                        d="M 10 120 Q 120 90, 210 65 T 390 35"
                        stroke="#1e4836"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 10 120 Q 120 90, 210 65 T 390 35 L 390 135 L 10 135 Z"
                        fill="url(#trafficGradient)"
                        opacity="0.12"
                      />
                      <defs>
                        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1e4836" />
                          <stop offset="100%" stopColor="#ffffff" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* CAC BY CHANNEL CARD */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-2xs space-y-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    CAC by channel
                  </h3>

                  <div className="space-y-4 pt-1">
                    {cacChannelsList.map((ch, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span className="text-gray-700">{ch.name}</span>
                          <span className="text-gray-900 font-semibold">{ch.cost}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
                          <div
                            className={`h-full rounded-full ${ch.barColor}`}
                            style={{ width: `${ch.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* CAMPAIGN LEADERBOARD TABLE */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Campaign leaderboard
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {leaderboardList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-gray-900">{item.name}</td>
                          <td className="py-4 px-6 text-gray-500 font-medium">{item.clicks}</td>
                          <td className="py-4 px-6 text-gray-500 font-medium">{item.convs}</td>
                          <td className="py-4 px-6 font-bold text-emerald-800 text-right">{item.cac}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}