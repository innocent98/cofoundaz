"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar";

type SalesTab = "Pipeline" | "Leads" | "Accounts" | "Sequences" | "AI Coach" | "Analytics";
type AICoachSubTab = "Role-play" | "Call prep";
type RolePlayState = "setup" | "chat" | "scorecard";

interface ToastState {
  show: boolean;
  message: string;
}

interface Deal {
  name: string;
  value: string;
  subtitle: string;
  statusTag?: { text: string; type: "alert" | "stalled" };
}

interface PipelineColumn {
  title: string;
  count: number;
  totalValue: string;
  deals: Deal[];
}

interface LeadItem {
  name: string;
  company: string;
  source: string;
  status: string;
}

interface AccountActivity {
  text: string;
  time: string;
}

interface AccountItem {
  id: string;
  name: string;
  description: string;
  openDealsCount: number;
  openDealsText: string;
  lifetimeValue: string;
  activities: AccountActivity[];
}

interface SequenceStep {
  stepNumber: number;
  waitText: string;
  subject: string;
  description: string;
}

interface SequenceItem {
  id: string;
  name: string;
  stats: string;
  steps: SequenceStep[];
  footerNote: string;
}

export default function SalesHub() {
  const [activeTab, setActiveTab] = useState<SalesTab>("Analytics");
  const [aiCoachSubTab, setAiCoachSubTab] = useState<AICoachSubTab>("Role-play");
  const [rolePlayState, setRolePlayState] = useState<RolePlayState>("setup");
  const [selectedPersona, setSelectedPersona] = useState<string>("Skeptical HR lead");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Friendly");
  const [isPersonaOpen, setIsPersonaOpen] = useState<boolean>(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState<boolean>(false);
  
  const [chatMessages, setChatMessages] = useState<string[]>([
    "Honestly, I am not sure my riders will trust an app to hold their money. Convince me."
  ]);
  const [userInputValue, setUserInputValue] = useState<string>("");

  const [selectedAccountId, setSelectedAccountId] = useState<string>("lagos-riders");
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });

  const showToastMsg = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3500);
  };

  const pipelineColumns: PipelineColumn[] = [
    {
      title: "New",
      count: 1,
      totalValue: "₦3.0M",
      deals: [{ name: "QuickCash", value: "₦3.0M", subtitle: "Qualify" }]
    },
    {
      title: "Contacted",
      count: 1,
      totalValue: "₦5.5M",
      deals: [{ name: "RiderPay", value: "₦5.5M", subtitle: "Book intro" }]
    },
    {
      title: "Qualified",
      count: 2,
      totalValue: "₦10.2M",
      deals: [
        { name: "Lagos Riders Co-op", value: "₦6.0M", subtitle: "Demo call Thu" },
        { name: "MarketPlus", value: "₦4.2M", subtitle: "Send deck" }
      ]
    },
    {
      title: "Proposal",
      count: 1,
      totalValue: "₦9.0M",
      deals: [{ name: "BodaBoda Union", value: "₦9.0M", subtitle: "Follow up (overdue)" }]
    },
    {
      title: "Negotiation",
      count: 1,
      totalValue: "₦12.0M",
      deals: [
        { 
          name: "GigPay HR", 
          value: "₦12.0M", 
          subtitle: "No activity 14d",
          statusTag: { text: "Stalled", type: "stalled" }
        }
      ]
    },
    {
      title: "Closed Won",
      count: 1,
      totalValue: "₦8.5M",
      deals: [{ name: "Thrive SACCO", value: "₦8.5M", subtitle: "Onboarding" }]
    },
    {
      title: "Closed Lost",
      count: 0,
      totalValue: "₦0.0M",
      deals: []
    }
  ];

  const leadsList: LeadItem[] = [
    { name: "Emeka O.", company: "Lagos Riders Co-op", source: "Referral", status: "New" },
    { name: "Bisi A.", company: "MarketPlus", source: "WhatsApp", status: "Qualified" },
    { name: "Tunde F.", company: "BodaBoda Union", source: "Event", status: "Working" },
    { name: "Ada N.", company: "GigPay HR", source: "Inbound", status: "Working" },
    { name: "Sola K.", company: "RiderPay", source: "Referral", status: "New" },
  ];

  const accountsList: AccountItem[] = [
    {
      id: "lagos-riders",
      name: "Lagos Riders Co-op",
      description: "Transport cooperative · 2,400 riders",
      openDealsCount: 1,
      openDealsText: "1 open · ₦6.0M",
      lifetimeValue: "₦6.0M",
      activities: [
        { text: "Demo scheduled for Thursday", time: "1d ago" },
        { text: "Sent one-pager", time: "4d ago" },
        { text: "Intro call completed", time: "1w ago" },
      ]
    },
    {
      id: "gigpay-hr",
      name: "GigPay HR",
      description: "HR platform · gig payroll",
      openDealsCount: 1,
      openDealsText: "1 open · ₦12.0M",
      lifetimeValue: "₦12.0M",
      activities: [
        { text: "No activity, 14 days", time: "stalled" },
        { text: "Proposal sent", time: "3w ago" },
      ]
    },
    {
      id: "thrive-sacco",
      name: "Thrive SACCO",
      description: "Savings cooperative",
      openDealsCount: 0,
      openDealsText: "0 open · ₦8.5M",
      lifetimeValue: "₦8.5M",
      activities: [
        { text: "Closed won, onboarding", time: "2d ago" },
      ]
    },
    {
      id: "market-plus",
      name: "MarketPlus",
      description: "Trader marketplace",
      openDealsCount: 1,
      openDealsText: "1 open · ₦4.2M",
      lifetimeValue: "₦4.2M",
      activities: [
        { text: "Deck requested", time: "2d ago" },
      ]
    }
  ];

  const sequencesData: SequenceItem[] = [
    {
      id: "new-account-outreach",
      name: "New account outreach",
      stats: "18 enrolled · 34% reply rate",
      steps: [
        {
          stepNumber: 1,
          waitText: "Wait 0 days, then send",
          subject: "A quick idea for {{company}}",
          description: "Noticed your riders get paid daily. Here is how Kolo helps them save."
        },
        {
          stepNumber: 2,
          waitText: "Wait 3 days, then send",
          subject: "Following up, {{first_name}}",
          description: "Sharing a one-pager and a short pilot proposal."
        },
        {
          stepNumber: 3,
          waitText: "Wait 5 days, then send",
          subject: "Worth a 15-minute call?",
          description: "Happy to walk your team through a 30-day pilot."
        }
      ],
      footerNote: "Unsubscribe link is appended automatically. Sequence stops when they reply."
    }
  ];

  const selectedAccount = accountsList.find((acc) => acc.id === selectedAccountId) || accountsList[0];

  const handleSendMessage = () => {
    if (!userInputValue.trim()) return;
    setChatMessages((prev) => [...prev, userInputValue, "Let us try that again. Why should I care about this?"]);
    setUserInputValue("");
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

        {/* HEADER - Sticky with white background */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200/80 shadow-xs w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="hover:text-gray-700 cursor-pointer">Workspace</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">Sales Hub</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <div className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-[#d2e2d8]">
                <span>Health</span>
                <span className="font-serif font-bold text-sm sm:text-base text-[#0e271f]">
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

              <button className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1">
                <span>+ Invite</span>
              </button>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1">
            <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {(
                [
                  "Pipeline",
                  "Leads",
                  "Accounts",
                  "Sequences",
                  "AI Coach",
                  "Analytics",
                ] as SalesTab[]
              ).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#eadaaf] text-[#2c220b] shadow-2xs font-semibold"
                        : "bg-[#eaeee9] text-gray-700 hover:bg-[#e0e6df]"
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full space-y-6">
          
          {/* PIPELINE TAB */}
          {activeTab === "Pipeline" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-wrap items-center gap-12 bg-white px-6 py-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    PIPELINE VALUE
                  </span>
                  <span className="text-3xl font-serif font-bold text-gray-900">
                    ₦42.0M
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    WEIGHTED FORECAST
                  </span>
                  <span className="text-3xl font-serif font-bold text-gray-900">
                    ₦18.4M
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    WIN RATE
                  </span>
                  <span className="text-3xl font-serif font-bold text-[#1e4836]">
                    31%
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-4 scrollbar-thin">
                <div className="flex items-start gap-4 min-w-[1300px]">
                  {pipelineColumns.map((col, idx) => (
                    <div 
                      key={idx} 
                      className="w-64 bg-[#f2f6f4]/60 rounded-2xl p-3 border border-gray-200/80 space-y-3 flex-shrink-0"
                    >
                      <div className="px-2 pt-1 flex items-center justify-between text-xs font-semibold text-gray-600">
                        <span>{col.title}</span>
                        <span className="text-gray-400 font-medium">
                          {col.count} · {col.totalValue}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {col.deals.map((deal, dIdx) => (
                          <div
                            key={dIdx}
                            className="bg-white rounded-xl p-4 border border-gray-200/90 shadow-2xs space-y-2 hover:border-gray-300 transition-all cursor-pointer"
                            onClick={() => showToastMsg(`Opened deal: ${deal.name}`)}
                          >
                            <div className="font-serif font-bold text-gray-900 text-base">
                              {deal.name}
                            </div>
                            <div className="font-bold text-emerald-900 text-sm">
                              {deal.value}
                            </div>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-gray-500 font-medium">
                                {deal.subtitle}
                              </span>
                              {deal.statusTag && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <span>⚠</span> Stalled
                                </span>
                              )}
                            </div>
                          </div>
                        ))}

                        {col.deals.length === 0 && (
                          <div className="h-20 flex items-center justify-center text-xs text-gray-400 italic">
                            No deals
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* LEADS TAB */}
          {activeTab === "Leads" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-serif font-semibold text-gray-900">Leads</h1>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => showToastMsg("CSV import: 2 duplicates skipped.")}
                    className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm border border-gray-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={() => showToastMsg("Quick-add lead opened.")}
                    className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer shadow-2xs"
                  >
                    + Add lead
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Name</th>
                      <th className="py-4 px-6">Company</th>
                      <th className="py-4 px-6">Source</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {leadsList.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-gray-900">{lead.name}</td>
                        <td className="py-4 px-6 text-gray-600">{lead.company}</td>
                        <td className="py-4 px-6 text-gray-600">{lead.source}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'Qualified' ? 'bg-emerald-100/70 text-emerald-800' :
                            lead.status === 'Working' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => showToastMsg(`Converted ${lead.name} to deal!`)}
                            className="text-xs font-semibold text-[#1e4836] hover:underline cursor-pointer"
                          >
                            Make deal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === "Accounts" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn items-start">
              <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 p-3 space-y-2 shadow-2xs">
                {accountsList.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-[#f0f4f1] border border-emerald-900/10 shadow-2xs" 
                          : "hover:bg-gray-50/80 border border-transparent"
                      }`}
                    >
                      <h4 className="font-serif font-bold text-gray-900 text-base">{acc.name}</h4>
                      <div className="text-xs text-gray-500 mt-1 font-medium">{acc.openDealsText}</div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200/95 p-6 sm:p-8 shadow-2xs space-y-6">
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
                    {selectedAccount.name}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    {selectedAccount.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#f7f9f8] rounded-xl p-4 border border-gray-200/60 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      OPEN DEALS
                    </span>
                    <span className="text-2xl font-serif font-bold text-gray-900">
                      {selectedAccount.openDealsCount}
                    </span>
                  </div>

                  <div className="bg-[#f7f9f8] rounded-xl p-4 border border-gray-200/60 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      LIFETIME VALUE
                    </span>
                    <span className="text-2xl font-serif font-bold text-gray-900">
                      {selectedAccount.lifetimeValue}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    ACTIVITY
                  </h3>

                  <div className="space-y-3">
                    {selectedAccount.activities.map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-2.5 text-gray-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#b89d5f]"></span>
                          <span>{act.text}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                          {act.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEQUENCES TAB */}
          {activeTab === "Sequences" && (
            <div className="space-y-6 animate-fadeIn">
              <h1 className="text-3xl font-serif font-semibold text-gray-900">Email sequences</h1>

              {sequencesData.map((seq) => (
                <div key={seq.id} className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                      {seq.name}
                    </h2>
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">
                      {seq.stats}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {seq.steps.map((step) => (
                      <div 
                        key={step.stepNumber} 
                        className="bg-[#f7f9f8] rounded-xl p-4 sm:p-5 border border-gray-200/70 flex items-start gap-4"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#e2ede6] text-[#1e4836] font-serif font-bold text-sm flex items-center justify-center flex-shrink-0 border border-[#d2e2d8]">
                          {step.stepNumber}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="text-xs text-gray-400 font-medium">
                            {step.waitText}
                          </div>
                          <div className="font-serif font-bold text-gray-900 text-base sm:text-lg">
                            {step.subject}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed pt-0.5">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-xs text-gray-400 italic">
                    {seq.footerNote}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI COACH TAB */}
          {activeTab === "AI Coach" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-serif font-semibold text-gray-900">AI sales coach</h1>
                <p className="text-sm text-gray-500 font-medium mt-0.5">Rehearse here, win out there.</p>
              </div>

              <div className="flex items-center gap-2">
                {(["Role-play", "Call prep"] as AICoachSubTab[]).map((subTab) => {
                  const isActive = aiCoachSubTab === subTab;
                  return (
                    <button
                      key={subTab}
                      onClick={() => {
                        setAiCoachSubTab(subTab);
                        if (subTab === "Role-play") setRolePlayState("setup");
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#eadaaf] text-[#2c220b] shadow-2xs"
                          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80"
                      }`}
                    >
                      {subTab}
                    </button>
                  );
                })}
              </div>

              {aiCoachSubTab === "Call prep" && (
                <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                      Call prep: GigPay HR
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-[#b89d5f] uppercase tracking-wider">
                      LIKELY OBJECTIONS
                    </h3>

                    <div className="space-y-3 text-sm text-gray-700">
                      <p>
                        <strong className="text-gray-900">Our riders will not trust an app with money.</strong> — Lead with your agent network and insured custody.
                      </p>
                      <p>
                        <strong className="text-gray-900">We have no budget for another tool.</strong> — Frame it as free for them; you monetize the saver.
                      </p>
                      <p>
                        <strong className="text-gray-900">Can we start small?</strong> — Yes, propose a 50-rider, 30-day pilot.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <h3 className="text-xs font-bold text-[#1e4836] uppercase tracking-wider">
                      YOUR GOAL FOR THE CALL
                    </h3>
                    <p className="text-sm text-gray-700 font-medium">
                      Secure a paid 30-day pilot with 50 of their riders.
                    </p>
                  </div>
                </div>
              )}

              {aiCoachSubTab === "Role-play" && (
                <>
                  {rolePlayState === "setup" && (
                    <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-xl font-serif font-bold text-gray-900">Set up a role-play</h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                        <div className="space-y-1.5 relative">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            Buyer persona
                          </label>
                          <div 
                            onClick={() => {
                              setIsPersonaOpen(!isPersonaOpen);
                              setIsDifficultyOpen(false);
                            }}
                            className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-between cursor-pointer hover:border-gray-400 transition-colors shadow-2xs"
                          >
                            <span>{selectedPersona}</span>
                            <span className="text-gray-400 text-xs">▼</span>
                          </div>

                          {isPersonaOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                              {["Skeptical HR lead", "Budget-conscious co-op", "Enthusiastic early adopter"].map((persona) => (
                                <div
                                  key={persona}
                                  onClick={() => {
                                    setSelectedPersona(persona);
                                    setIsPersonaOpen(false);
                                  }}
                                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                    selectedPersona === persona ? "bg-gray-600 text-white font-semibold" : "hover:bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {persona}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 relative">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                            Difficulty
                          </label>
                          <div 
                            onClick={() => {
                              setIsDifficultyOpen(!isDifficultyOpen);
                              setIsPersonaOpen(false);
                            }}
                            className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium flex items-center justify-between cursor-pointer hover:border-gray-400 transition-colors shadow-2xs"
                          >
                            <span>{selectedDifficulty}</span>
                            <span className="text-gray-400 text-xs">▼</span>
                          </div>

                          {isDifficultyOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                              {["Friendly", "Realistic", "Tough"].map((diff) => (
                                <div
                                  key={diff}
                                  onClick={() => {
                                    setSelectedDifficulty(diff);
                                    setIsDifficultyOpen(false);
                                  }}
                                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                    selectedDifficulty === diff ? "bg-gray-600 text-white font-semibold" : "hover:bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {diff}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => setRolePlayState("chat")}
                        className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-2xs"
                      >
                        Start role-play
                      </button>
                    </div>
                  )}

                  {rolePlayState === "chat" && (
                    <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                      <div className="space-y-4 min-h-[180px]">
                        {chatMessages.map((msg, idx) => (
                          <div key={idx} className="flex">
                            <div className="bg-[#f0f4f1] text-gray-800 border border-emerald-900/10 px-5 py-3.5 rounded-2xl max-w-xl text-sm font-medium shadow-2xs">
                              {msg}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <input
                          type="text"
                          value={userInputValue}
                          onChange={(e) => setUserInputValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                          placeholder="Your response to the buyer..."
                          className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-500 shadow-2xs"
                        />
                        <button
                          onClick={handleSendMessage}
                          className="bg-[#1e4836] hover:bg-[#153426] text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-2xs"
                        >
                          Send
                        </button>
                      </div>

                      <div>
                        <button
                          onClick={() => setRolePlayState("scorecard")}
                          className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
                        >
                          End session
                        </button>
                      </div>
                    </div>
                  )}

                  {rolePlayState === "scorecard" && (
                    <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                      <div className="space-y-1">
                        <h2 className="text-xl font-serif font-bold text-gray-900">Session scorecard</h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#f7f9f8] rounded-xl p-5 border border-gray-200/60 text-center space-y-1">
                          <div className="text-3xl font-serif font-bold text-gray-900">7/10</div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Discovery</div>
                        </div>

                        <div className="bg-[#f7f9f8] rounded-xl p-5 border border-gray-200/60 text-center space-y-1">
                          <div className="text-3xl font-serif font-bold text-gray-900">6/10</div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Objections</div>
                        </div>

                        <div className="bg-[#f7f9f8] rounded-xl p-5 border border-gray-200/60 text-center space-y-1">
                          <div className="text-3xl font-serif font-bold text-gray-900">5/10</div>
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Next-step close</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed pt-2">
                        Your discovery was strong. Next time, name the cost of inaction earlier and ask for a specific next step before you close. Rough edges found here are cheap. Found in the room, they are expensive.
                      </p>

                      <div>
                        <button
                          onClick={() => {
                            setRolePlayState("setup");
                            setChatMessages(["Honestly, I am not sure my riders will trust an app to hold their money. Convince me."]);
                          }}
                          className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer shadow-2xs"
                        >
                          Practice this again
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ANALYTICS TAB - MATCHING SCREENSHOT DESIGN EXACTLY */}
          {activeTab === "Analytics" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-serif font-semibold text-gray-900">Sales analytics</h1>
              </div>

              {/* TOP GRID: FUNNEL BY STAGE & WIN/LOSS REASONS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* FUNNEL BY STAGE CARD */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                  <h3 className="text-sm font-bold text-gray-900">Funnel by stage</h3>

                  <div className="space-y-5">
                    {/* New */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span>New</span>
                        <span className="font-bold text-gray-900">12</span>
                      </div>
                      <div className="w-full bg-emerald-900/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-full"></div>
                      </div>
                    </div>

                    {/* Qualified */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span>Qualified</span>
                        <span className="font-bold text-gray-900">7</span>
                      </div>
                      <div className="w-full bg-emerald-900/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-[60%]"></div>
                      </div>
                    </div>

                    {/* Proposal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span>Proposal</span>
                        <span className="font-bold text-gray-900">4</span>
                      </div>
                      <div className="w-full bg-emerald-900/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-[35%]"></div>
                      </div>
                    </div>

                    {/* Negotiation */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span>Negotiation</span>
                        <span className="font-bold text-gray-900">2</span>
                      </div>
                      <div className="w-full bg-emerald-900/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-[20%]"></div>
                      </div>
                    </div>

                    {/* Won */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-700">
                        <span>Won</span>
                        <span className="font-bold text-gray-900">1</span>
                      </div>
                      <div className="w-full bg-emerald-900/10 rounded-full h-3 overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-[10%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WIN / LOSS REASONS CARD */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
                  <h3 className="text-sm font-bold text-gray-900">Win / loss reasons</h3>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
                    {/* Donut Chart Mockup */}
                    <div className="relative w-36 h-36 rounded-full border-[14px] border-[#1e4836] flex items-center justify-center shadow-inner">
                      <div className="absolute inset-0 rounded-full border-[14px] border-transparent border-t-[#b89d5f] border-r-[#b89d5f] rotate-45"></div>
                      <div className="absolute inset-0 rounded-full border-[14px] border-transparent border-b-[#a65243] border-l-transparent -rotate-12"></div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2.5 text-xs font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1e4836]"></span>
                        <span>Won 31%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#b89d5f]"></span>
                        <span>Price 24%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#a65243]"></span>
                        <span>Timing 45%</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* BOTTOM STATS ROW CARD */}
              <div className="bg-white rounded-2xl border border-gray-200/90 p-6 sm:p-8 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      AVG CYCLE LENGTH
                    </span>
                    <span className="text-3xl font-serif font-bold text-gray-900">
                      34 days
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      CLOSED THIS MONTH
                    </span>
                    <span className="text-3xl font-serif font-bold text-[#1e4836]">
                      ₦8.5M
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      AVG DEAL SIZE
                    </span>
                    <span className="text-3xl font-serif font-bold text-gray-900">
                      ₦7.0M
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}