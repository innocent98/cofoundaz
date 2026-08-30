"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/sidebar";

type TabName =
  | "Overview"
  | "Smoke tests"
  | "Interview scripts"
  | "Interviews"
  | "Surveys"
  | "Assumptions"
  | "MVP feedback";

interface ToastState {
  show: boolean;
  message: string;
}

interface SmokeTestItem {
  id: string;
  test: string;
  status: "Live" | "Ended";
  visits: string;
  signups: string;
  conversion: string;
  viewedPricing: string;
  liveUrl: string;
  signalDesc: string;
}

interface InterviewNoteItem {
  id: string;
  interviewee: string;
  segmentTag: string;
  quote: string;
  stance: "Supports" | "Contradicts" | "Neutral";
}

interface FeedbackItem {
  id: string;
  type: "Interview" | "In-app" | "Email";
  source: string;
  text: string;
}

interface InsightItem {
  id: string;
  title: string;
  mentionCount: string;
  iconBg: string;
  iconText: string;
}

export default function ValidationHub() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });

  // Smoke Tests Flow State
  const [smokeView, setSmokeView] = useState<"list" | "wizard" | "detail">("list");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [heroHeadline, setHeroHeadline] = useState("Save without thinking about it");
  const [ctaButtonText, setCtaButtonText] = useState("Join the waitlist");
  const [showPricingSection, setShowPricingSection] = useState(false);
  const [successMetric, setSuccessMetric] = useState("Email signup");
  const [targetConversion, setTargetConversion] = useState("5%");
  const [pageSlug, setPageSlug] = useState("kolo");
  const [selectedTest, setSelectedTest] = useState<SmokeTestItem | null>(null);

  // Interview Scripts Flow State
  const [selectedScriptOption, setSelectedScriptOption] = useState("Willingness to pay ₦500/mo");
  const [isScriptDropdownOpen, setIsScriptDropdownOpen] = useState(false);
  const [isScriptGenerated, setIsScriptGenerated] = useState(false);

  // Interviews Flow State
  const [intervieweeInput, setIntervieweeInput] = useState("");
  const [segmentTagInput, setSegmentTagInput] = useState("");
  const [quoteInput, setQuoteInput] = useState("");
  const [selectedStance, setSelectedStance] = useState<"Supports" | "Contradicts" | "Neutral">("Supports");
  
  const [interviewsList, setInterviewsList] = useState<InterviewNoteItem[]>([
    {
      id: "1",
      interviewee: "Chidi",
      segmentTag: "Okada rider",
      quote: "“If it just took a little each trip, I would not even miss it.”",
      stance: "Supports",
    },
    {
      id: "2",
      interviewee: "Funke",
      segmentTag: "Market trader",
      quote: "“Keeping cash in a box is my biggest worry.”",
      stance: "Supports",
    },
    {
      id: "3",
      interviewee: "Yaw",
      segmentTag: "Delivery gig",
      quote: "“I might use it, but I really want investing too.”",
      stance: "Neutral",
    },
  ]);

  // Surveys Flow State
  const [isCollectingSurveys, setIsCollectingSurveys] = useState(true);
  const [surveyLinkCopied, setSurveyLinkCopied] = useState(false);

  // MVP Feedback Flow State (Images 2, 3, 4)
  const [mvpViewState, setMvpViewState] = useState<"initial" | "loading" | "synthesized">("initial");

  const rawFeedbackList: FeedbackItem[] = [
    {
      id: "1",
      type: "Interview",
      source: "Chidi",
      text: "I would need to be sure my money is safe before I put it in.",
    },
    {
      id: "2",
      type: "In-app",
      source: "Beta user",
      text: "Love the round-ups. Can it round up every ride automatically?",
    },
    {
      id: "3",
      type: "Email",
      source: "Waitlist",
      text: "Do you also let me invest what I save?",
    },
    {
      id: "4",
      type: "Interview",
      source: "Funke",
      text: "Who is behind this app? I need to trust the people.",
    },
  ];

  const synthesizedInsights: InsightItem[] = [
    {
      id: "1",
      title: "Trust is the real blocker, not the feature set",
      mentionCount: "Mentioned 14x across 9 sources",
      iconBg: "bg-green-100",
      iconText: "◆",
    },
    {
      id: "2",
      title: "Round-ups on each transaction is the most-wanted mechanic",
      mentionCount: "Mentioned 11x across 7 sources",
      iconBg: "bg-green-50",
      iconText: "↗",
    },
    {
      id: "3",
      title: "Investing keeps coming up as a fast follow",
      mentionCount: "Mentioned 8x across 6 sources",
      iconBg: "bg-green-50/60",
      iconText: "☺",
    },
  ];

  // Initial Smoke Tests List
  const [smokeTestsList, setSmokeTestsList] = useState<SmokeTestItem[]>([
    {
      id: "1",
      test: "Automated savings landing page",
      status: "Live",
      visits: "1,240",
      signups: "112",
      conversion: "9.0%",
      viewedPricing: "386",
      liveUrl: "kolo.cofoundaz.site",
      signalDesc: "Against your 5% bar, this looks validated. Strong intent for a paid savings product.",
    },
    {
      id: "2",
      test: "Family wallet fake-door",
      status: "Live",
      visits: "820",
      signups: "38",
      conversion: "4.6%",
      viewedPricing: "120",
      liveUrl: "family.cofoundaz.site",
      signalDesc: "Below your target conversion bar. Further iteration or interviews recommended.",
    },
    {
      id: "3",
      test: "Investing waitlist",
      status: "Ended",
      visits: "540",
      signups: "61",
      conversion: "11.3%",
      viewedPricing: "210",
      liveUrl: "invest.cofoundaz.site",
      signalDesc: "High early demand metrics recorded during the campaign window.",
    },
  ]);

  const tabs: TabName[] = [
    "Overview",
    "Smoke tests",
    "Interview scripts",
    "Interviews",
    "Surveys",
    "Assumptions",
    "MVP feedback",
  ];

  const scriptOptions = [
    "Willingness to pay ₦500/mo",
    "The problem is real",
    "WhatsApp is the right channel",
  ];

  const triggerExperimentToast = () => {
    setActiveTab("Assumptions");
    setToast({
      show: true,
      message: "Drafting an experiment for that assumption.",
    });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 4000);
  };

  const handleSynthesizeInsights = () => {
    setMvpViewState("loading");
    setTimeout(() => {
      setMvpViewState("synthesized");
    }, 1800);
  };

  const handleSendToRoadmap = (insightTitle: string) => {
    setToast({
      show: true,
      message: `Sent “${insightTitle}” to your roadmap.`,
    });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 4000);
  };

  const handleSaveInterviewNote = () => {
    if (!intervieweeInput || !quoteInput) return;
    const newNote: InterviewNoteItem = {
      id: Date.now().toString(),
      interviewee: intervieweeInput,
      segmentTag: segmentTagInput || "General",
      quote: `“${quoteInput}”`,
      stance: selectedStance,
    };
    setInterviewsList([newNote, ...interviewsList]);
    setIntervieweeInput("");
    setSegmentTagInput("");
    setQuoteInput("");
    setToast({
      show: true,
      message: "Interview note saved.",
    });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 4000);
  };

  const handleCopySurveyLink = () => {
    setSurveyLinkCopied(true);
    setToast({
      show: true,
      message: "Survey link copied to clipboard.",
    });
    setTimeout(() => {
      setSurveyLinkCopied(false);
      setToast({ show: false, message: "" });
    }, 3000);
  };

  const handleToggleSurveyCollection = () => {
    const nextState = !isCollectingSurveys;
    setIsCollectingSurveys(nextState);
    setToast({
      show: true,
      message: nextState ? "Survey collection resumed." : "Survey collection stopped.",
    });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
  };

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col bg-[#f5f7f5] text-[#2c3531] font-body lg:pl-64">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 block bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <div className="relative z-10 flex min-h-screen w-full flex-col">
        {/* GLOBAL TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-[#0e271f] text-white px-5 py-2.5 rounded-card shadow-raised flex items-center gap-3 border border-[#1f4236]">
              <div className="flex items-center justify-center text-green-400 font-bold text-sm">
                ✓
              </div>
              <span className="font-medium text-sm tracking-wide text-sage-100">
                {toast.message}
              </span>
            </div>
          </div>
        )}

        {/* HEADER / NAVIGATION BAR */}
        <header className="sticky top-0 z-30 bg-[#f5f7f5]/95 backdrop-blur-sm border-b border-sage-200/70 shadow-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-sage-500">
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-card border border-sage-200 bg-white text-sage-700 shadow-card transition-colors hover:bg-sage-50 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <span className="hover:text-sage-700 cursor-pointer">Workspace</span>
              <span>/</span>
              <span className="font-semibold text-sage-900">Validation Hub</span>
            </div>

            <div className="flex items-center gap-2 md:gap-3 ml-auto">
              <div className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 md:px-3.5 md:py-1.5 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 border border-[#d2e2d8]">
                <span>Health</span>
                <span className="font-display font-bold text-sm md:text-base text-[#0e271f]">
                  72
                </span>
                <span className="text-xs">↑</span>
              </div>

              <button
                aria-label="Notifications"
                className="relative p-2 md:p-2.5 rounded-card bg-white border border-sage-200 text-sage-600 hover:bg-sage-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="bg-[#9C5B34] hover:bg-[#9C5B34] text-[#1c180e] font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-card text-xs md:text-sm transition-colors flex items-center gap-1">
                <span>+ Invite</span>
              </button>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3 pt-1">
            <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === "Smoke tests") {
                        setSmokeView("list");
                      }
                    }}
                    className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#EAD5C6] text-[#2c220b] shadow-card font-semibold"
                        : "bg-[#eaeee9] text-sage-700 hover:bg-[#e0e6df]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="max-w-7xl mx-auto w-full flex-1 space-y-6 px-4 pt-6 md:px-6">
          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
                  Validation Hub
                </h1>
                <p className="text-sage-500 mt-1 text-sm md:text-base">
                  Prove it before you build it.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
                  <span className="text-3xl md:text-4xl font-display font-bold text-[#1e4836]">
                    3
                  </span>
                  <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">Validated</span>
                </div>
                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
                  <span className="text-3xl md:text-4xl font-display font-bold text-[#9d362b]">
                    1
                  </span>
                  <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">Invalidated</span>
                </div>
                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
                  <span className="text-3xl md:text-4xl font-display font-bold text-[#9C5B34]">
                    2
                  </span>
                  <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">Untested</span>
                </div>
                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card">
                  <span className="text-3xl md:text-4xl font-display font-bold text-[#2d3732]">
                    2
                  </span>
                  <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">
                    Live experiments
                  </span>
                </div>
                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card col-span-2 md:col-span-1">
                  <span className="text-3xl md:text-4xl font-display font-bold text-[#2d3732]">
                    284
                  </span>
                  <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">
                    Responses collected
                  </span>
                </div>
              </div>

              <div className="bg-[#0e271f] text-white rounded-modal p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
                <div className="flex items-start md:items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-card bg-[#9C5B34] text-[#1c180e] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm md:text-base">
                      Your riskiest untested assumption
                    </h3>
                    <p className="text-sage-300 text-xs md:text-sm mt-0.5 italic">
                      “Gig workers will pay ₦500 per month for automated savings.”
                    </p>
                  </div>
                </div>

                <button
                  onClick={triggerExperimentToast}
                  className="bg-[#9C5B34] hover:bg-[#9C5B34] text-[#1c180e] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-card text-xs md:text-sm transition-all shrink-0 self-start md:self-auto cursor-pointer"
                >
                  Design experiment
                </button>
              </div>
            </div>
          )}

          {/* ==================== MVP FEEDBACK TAB (MATCHING IMAGES 2, 3, 4) ==================== */}
          {activeTab === "MVP feedback" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
                  MVP feedback
                </h1>

                <button
                  onClick={handleSynthesizeInsights}
                  disabled={mvpViewState === "loading"}
                  className="bg-[#9C5B34] hover:bg-[#9C5B34] text-[#1c180e] font-semibold px-4 py-2.5 rounded-card text-xs md:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-card disabled:opacity-75"
                >
                  <span>✦ Synthesize insights</span>
                </button>
              </div>

              {/* INITIAL STATE (IMAGE 2) */}
              {mvpViewState === "initial" && (
                <div className="space-y-4">
                  {rawFeedbackList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-modal p-5 md:p-6 border border-sage-200/80 space-y-3 shadow-card"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-sage-100 text-sage-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {item.type}
                        </span>
                        <span className="text-xs text-sage-400 font-medium">{item.source}</span>
                      </div>
                      <p className="text-sage-800 text-sm md:text-base">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* LOADING STATE (IMAGE 3) */}
              {mvpViewState === "loading" && (
                <div className="bg-white rounded-modal p-16 border border-sage-200/80 flex flex-col items-center justify-center text-center space-y-6 shadow-card my-8 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full border-4 border-sage-200 border-t-[#9C5B34] animate-spin"></div>
                  <p className="text-sage-700 font-display text-lg italic">
                    Reading every note for patterns...
                  </p>
                </div>
              )}

              {/* SYNTHESIZED STATE (IMAGES 4 & 5) */}
              {mvpViewState === "synthesized" && (
                <div className="space-y-4 animate-fadeIn">
                  {synthesizedInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="bg-white rounded-modal p-5 md:p-6 border border-sage-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-card ${insight.iconBg} text-[#1e4836] font-bold flex items-center justify-center shrink-0 mt-0.5 md:mt-0`}
                        >
                          {insight.iconText}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-sage-900 text-sm md:text-base">
                            {insight.title}
                          </h3>
                          <p className="text-xs text-sage-400 font-medium">
                            {insight.mentionCount}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendToRoadmap(insight.title)}
                        className="bg-white hover:bg-sage-50 border border-sage-200 text-sage-700 font-semibold px-4 py-2 rounded-card text-xs transition-all cursor-pointer shadow-card shrink-0 self-start md:self-auto"
                      >
                        Send to roadmap
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== SURVEYS TAB ==================== */}
          {activeTab === "Surveys" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
                  Surveys
                </h1>

                <button
                  onClick={handleToggleSurveyCollection}
                  className={`px-4 py-2 rounded-card text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
                    isCollectingSurveys
                      ? "bg-white border-sage-300 text-sage-700 hover:bg-sage-50 shadow-card"
                      : "bg-[#1e4836] border-[#1e4836] text-white shadow-card"
                  }`}
                >
                  {isCollectingSurveys ? "Stop collecting" : "Resume collecting"}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-white rounded-modal p-6 border border-sage-200/80 space-y-6 shadow-card">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sage-900 text-base">Pricing survey</h3>
                      <span
                        className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isCollectingSurveys
                            ? "bg-green-100 text-green-800"
                            : "bg-copper-100 text-copper-800"
                        }`}
                      >
                        {isCollectingSurveys ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-sage-500">
                      3 questions · 142 responses · 71% completion
                    </p>
                  </div>

                  <div className="bg-[#f5f7f5] rounded-card p-4 border border-sage-200/60 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className="block text-[11px] font-semibold text-sage-400 uppercase tracking-wider">
                        Share link
                      </span>
                      <span className="block text-sm font-semibold text-[#1e4836] truncate">
                        kolo.link/s/pr
                      </span>
                    </div>

                    <button
                      onClick={handleCopySurveyLink}
                      className="bg-white hover:bg-sage-50 border border-sage-200 text-sage-700 font-medium px-3 py-2 rounded-input text-xs transition-all shrink-0 cursor-pointer shadow-card"
                    >
                      {surveyLinkCopied ? "Copied!" : "Copy link"}
                    </button>
                  </div>

                  <div className="bg-[#0e271f] rounded-card p-5 flex items-center justify-between text-white">
                    <div className="space-y-1">
                      <span className="text-xs text-sage-300">Target Segment</span>
                      <p className="text-sm font-semibold">Active Gig Workers</p>
                    </div>
                    <div className="w-12 h-12 bg-[#1b3a30] rounded-input p-2 grid grid-cols-2 gap-1.5 border border-[#2b5446]">
                      <div className="bg-white/90 rounded-xs"></div>
                      <div className="bg-white/90 rounded-xs"></div>
                      <div className="bg-white/90 rounded-xs"></div>
                      <div className="bg-[#9C5B34] rounded-xs"></div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-6 shadow-card">
                  <div>
                    <h3 className="font-bold text-sage-900 text-base">Would you pay ₦500/mo?</h3>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs md:text-sm font-medium">
                        <span className="text-sage-800">Definitely</span>
                        <span className="font-bold text-sage-900">41%</span>
                      </div>
                      <div className="w-full bg-sage-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-sage-200/50">
                        <div
                          className="bg-[#1e4836] h-full rounded-full transition-all duration-1000"
                          style={{ width: "41%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs md:text-sm font-medium">
                        <span className="text-sage-800">Maybe</span>
                        <span className="font-bold text-sage-900">38%</span>
                      </div>
                      <div className="w-full bg-sage-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-sage-200/50">
                        <div
                          className="bg-[#9C5B34] h-full rounded-full transition-all duration-1000"
                          style={{ width: "38%" }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs md:text-sm font-medium">
                        <span className="text-sage-800">No</span>
                        <span className="font-bold text-sage-900">21%</span>
                      </div>
                      <div className="w-full bg-sage-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-sage-200/50">
                        <div
                          className="bg-[#9d362b] h-full rounded-full transition-all duration-1000"
                          style={{ width: "21%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== INTERVIEWS TAB ==================== */}
          {activeTab === "Interviews" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
                  Interview notes
                </h1>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-white rounded-modal p-6 border border-sage-200/80 space-y-4 shadow-card">
                  <div>
                    <h3 className="font-bold text-sage-900 text-sm">New note</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Interviewee"
                        value={intervieweeInput}
                        onChange={(e) => setIntervieweeInput(e.target.value)}
                        className="w-full bg-white border border-sage-200 rounded-card px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836]"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Segment tag"
                        value={segmentTagInput}
                        onChange={(e) => setSegmentTagInput(e.target.value)}
                        className="w-full bg-white border border-sage-200 rounded-card px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836]"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={4}
                        placeholder="Notes and key quotes..."
                        value={quoteInput}
                        onChange={(e) => setQuoteInput(e.target.value)}
                        className="w-full bg-white border border-sage-200 rounded-card px-4 py-2.5 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedStance("Supports")}
                        className={`py-2 px-3 rounded-card text-xs font-semibold transition-all border cursor-pointer ${
                          selectedStance === "Supports"
                            ? "bg-white text-green-800 border-green-800 shadow-card"
                            : "bg-white text-sage-600 border-sage-200 hover:bg-sage-50"
                        }`}
                      >
                        Supports
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStance("Contradicts")}
                        className={`py-2 px-3 rounded-card text-xs font-semibold transition-all border cursor-pointer ${
                          selectedStance === "Contradicts"
                            ? "bg-white text-red-800 border-red-800 shadow-card"
                            : "bg-white text-sage-600 border-sage-200 hover:bg-sage-50"
                        }`}
                      >
                        Contradicts
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStance("Neutral")}
                        className={`py-2 px-3 rounded-card text-xs font-semibold transition-all border cursor-pointer ${
                          selectedStance === "Neutral"
                            ? "bg-white text-sage-900 border-sage-900 shadow-card"
                            : "bg-white text-sage-600 border-sage-200 hover:bg-sage-50"
                        }`}
                      >
                        Neutral
                      </button>
                    </div>

                    <button
                      onClick={handleSaveInterviewNote}
                      className="w-full bg-[#9C5B34] hover:bg-[#9C5B34] text-[#1c180e] font-semibold py-3 rounded-card text-sm transition-all cursor-pointer shadow-card mt-2"
                    >
                      Save note
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  {interviewsList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-modal p-5 border border-sage-200/80 space-y-3 shadow-card hover:border-sage-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sage-900 text-sm">
                          {item.interviewee} · {item.segmentTag}
                        </h4>
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-medium ${
                            item.stance === "Supports"
                              ? "bg-green-100 text-green-800"
                              : item.stance === "Contradicts"
                              ? "bg-red-100 text-red-800"
                              : "bg-sage-100 text-sage-700"
                          }`}
                        >
                          {item.stance}
                        </span>
                      </div>
                      <p className="text-sage-600 text-sm italic font-display leading-relaxed">
                        {item.quote}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== INTERVIEW SCRIPTS TAB ==================== */}
          {activeTab === "Interview scripts" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
                  Interview scripts
                </h1>
              </div>

              <div className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-6 shadow-card max-w-4xl relative">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-sage-500 mb-2">
                    Generate a script for
                  </label>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                    <div className="relative flex-1">
                      <div
                        onClick={() => setIsScriptDropdownOpen(!isScriptDropdownOpen)}
                        className="w-full bg-white border border-[#9C5B34] rounded-card px-4 py-3 text-sm text-sage-900 flex items-center justify-between cursor-pointer shadow-card"
                      >
                        <span className="font-medium">{selectedScriptOption}</span>
                        <svg
                          className={`w-4 h-4 text-sage-600 transition-transform ${
                            isScriptDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>

                      {isScriptDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-sage-200 rounded-card shadow-raised z-30 overflow-hidden divide-y divide-sage-100">
                          {scriptOptions.map((option) => (
                            <div
                              key={option}
                              onClick={() => {
                                setSelectedScriptOption(option);
                                setIsScriptDropdownOpen(false);
                              }}
                              className={`px-4 py-3 text-sm cursor-pointer transition-colors ${
                                selectedScriptOption === option
                                  ? "bg-sage-600 text-white font-medium"
                                  : "text-sage-800 hover:bg-sage-50"
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setIsScriptGenerated(true)}
                      className="bg-[#9C5B34] hover:bg-[#9C5B34] text-[#1c180e] font-semibold px-5 py-3 rounded-card text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-card whitespace-nowrap"
                    >
                      <span>✦ Generate script</span>
                    </button>
                  </div>
                </div>
              </div>

              {isScriptGenerated && (
                <div className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 space-y-6 shadow-card max-w-4xl animate-fadeIn">
                  <div>
                    <h3 className="text-lg font-display font-bold text-sage-900">Draft script</h3>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-sage-900">
                        Tell me about the last time you tried to save money.
                      </p>
                      <p className="text-xs text-[#9C5B34] font-medium">
                        Tip: Ask about the last time it happened, not hypotheticals.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-sage-900">
                        What did you do, step by step?
                      </p>
                      <p className="text-xs text-[#9C5B34] font-medium">
                        Tip: Follow the actual behavior, not intentions.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-sage-900">
                        What was frustrating about it?
                      </p>
                      <p className="text-xs text-[#9C5B34] font-medium">
                        Tip: Let them talk; do not lead them.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-semibold text-sage-900">
                        If a tool did that for you automatically, what would it be worth?
                      </p>
                      <p className="text-xs text-[#9C5B34] font-medium">
                        Tip: Anchor on their words, not your price.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== ASSUMPTIONS TAB ==================== */}
          {activeTab === "Assumptions" && (
            <div className="space-y-6">
              <div className="bg-[#0e271f] text-white rounded-modal p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
                <div className="flex items-start md:items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-card bg-[#9C5B34] text-[#1c180e] flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-xs md:text-sm font-medium">
                      Your riskiest untested assumption:{" "}
                      <span className="italic font-normal">
                        “Gig workers will pay ₦500/month.”
                      </span>{" "}
                      Want an experiment for it?
                    </p>
                  </div>
                </div>

                <button
                  onClick={triggerExperimentToast}
                  className="bg-[#9C5B34] hover:bg-[#9C5B34] text-[#1c180e] font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-card text-xs md:text-sm transition-all shrink-0 self-start md:self-auto cursor-pointer"
                >
                  Design experiment
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card">
                  <div className="flex items-center justify-between border-b border-sage-100 pb-3">
                    <h3 className="font-bold text-sage-900 text-xs md:text-sm tracking-wide">
                      Untested
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card">
                      <p className="text-xs md:text-sm font-medium text-sage-800">
                        Users trust us to hold their money
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          High risk
                        </span>
                        <span className="text-[11px] text-sage-400">0 evidence</span>
                      </div>
                    </div>
                    <div className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card">
                      <p className="text-xs md:text-sm font-medium text-sage-800">
                        Agents will refer their customers
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="bg-copper-100 text-copper-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Med risk
                        </span>
                        <span className="text-[11px] text-sage-400">0 evidence</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card">
                  <div className="flex items-center justify-between border-b border-sage-100 pb-3">
                    <h3 className="font-bold text-sage-900 text-xs md:text-sm tracking-wide">
                      Testing
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card">
                      <p className="text-xs md:text-sm font-medium text-sage-800">
                        Gig workers will pay ₦500/mo for automated savings
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          High risk
                        </span>
                        <span className="text-[11px] text-sage-500 font-medium">2 evidence</span>
                      </div>
                    </div>
                    <div className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card">
                      <p className="text-xs md:text-sm font-medium text-sage-800">
                        WhatsApp is the cheapest acquisition channel
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="bg-copper-100 text-copper-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Med risk
                        </span>
                        <span className="text-[11px] text-sage-500 font-medium">1 evidence</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card">
                  <div className="flex items-center justify-between border-b border-sage-100 pb-3">
                    <h3 className="font-bold text-green-800 text-xs md:text-sm tracking-wide">
                      Validated
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card">
                      <p className="text-xs md:text-sm font-medium text-sage-800">
                        The problem (no easy saving) is real and painful
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="bg-red-100 text-red-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          High risk
                        </span>
                        <span className="text-[11px] text-sage-500 font-medium">6 evidence</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-modal p-4 md:p-5 border border-sage-200/80 space-y-4 shadow-card">
                  <div className="flex items-center justify-between border-b border-sage-100 pb-3">
                    <h3 className="font-bold text-red-800 text-xs md:text-sm tracking-wide">
                      Invalidated
                    </h3>
                    <span className="w-6 h-6 rounded-full bg-sage-100 text-sage-600 text-xs font-semibold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-[#f9faf8] rounded-card p-3.5 border border-sage-100 space-y-3 shadow-card">
                      <p className="text-xs md:text-sm font-medium text-sage-800">
                        A locked wallet increases retention
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          Low risk
                        </span>
                        <span className="text-[11px] text-sage-500 font-medium">3 evidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PLACEHOLDER FOR OTHER TABS */}
          {!["Overview", "Interview scripts", "Interviews", "Surveys", "Assumptions", "MVP feedback", "Smoke tests"].includes(activeTab) && (
            <div className="bg-white rounded-modal p-12 border border-sage-200 text-center space-y-3 shadow-card">
              <h2 className="text-xl font-display font-semibold text-sage-800">
                {activeTab} View
              </h2>
              <p className="text-sm text-sage-500">
                This section is fully configured and connected to the workspace navigation.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}