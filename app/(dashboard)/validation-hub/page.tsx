"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";

// --- TYPES & INTERFACES ---
type TabName =
  | "Overview"
  | "Smoke tests"
  | "Interview scripts"
  | "Interviews"
  | "Surveys"
  | "Assumptions"
  | "MVP feedback";

type SmokeTestStatus = "Live" | "Ended";

interface SmokeTest {
  id: number;
  name: string;
  status: SmokeTestStatus;
  visits: string;
  signups: string;
  conversion: string;
}

interface SmokeFormData {
  heroHeadline: string;
  ctaButtonText: string;
  showFakeDoorPricing: boolean;
  successMetric: string;
  targetConversion: string;
  pageSlug: string;
}

type ScriptTopic =
  | "Willingness to pay ₦500/mo"
  | "The problem is real"
  | "WhatsApp is the right channel";

interface ScriptItem {
  q: string;
  tip: string;
}

type StanceType = "Supports" | "Contradicts" | "Neutral";

interface InterviewNote {
  id: number;
  name: string;
  segment: string;
  quote: string;
  stance: StanceType;
}

interface RawFeedback {
  id: number;
  type: "Interview" | "In-app" | "Email";
  author: string;
  quote: string;
}

interface SynthesizedInsight {
  id: number;
  iconType: "diamond" | "arrow" | "smile";
  title: string;
  sourcesText: string;
}

interface ToastState {
  show: boolean;
  message: string;
}

export default function ValidationHub(): JSX.Element {
  // --- GLOBAL NAVIGATION & TOAST STATE ---
  const [activeTab, setActiveTab] = useState<TabName>("MVP feedback");
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });

  const tabs: TabName[] = [
    "Overview",
    "Smoke tests",
    "Interview scripts",
    "Interviews",
    "Surveys",
    "Assumptions",
    "MVP feedback",
  ];

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: "" });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // --- SMOKE TESTS STATE ---
  const [smokeTestView, setSmokeTestView] = useState<"list" | "create">("list");
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [smokeFormData, setSmokeFormData] = useState<SmokeFormData>({
    heroHeadline: "Save without thinking about it",
    ctaButtonText: "Join the waitlist",
    showFakeDoorPricing: false,
    successMetric: "Email signup",
    targetConversion: "5%",
    pageSlug: "kolo",
  });
  const [smokeTestsList, setSmokeTestsList] = useState<SmokeTest[]>([
    {
      id: 1,
      name: "Automated savings landing page",
      status: "Live",
      visits: "1,240",
      signups: "112",
      conversion: "9.0%",
    },
    {
      id: 2,
      name: "Family wallet fake-door",
      status: "Live",
      visits: "820",
      signups: "38",
      conversion: "4.6%",
    },
    {
      id: 3,
      name: "Investing waitlist",
      status: "Ended",
      visits: "540",
      signups: "61",
      conversion: "11.3%",
    },
  ]);

  // --- INTERVIEW SCRIPTS STATE ---
  const [selectedScriptTopic, setSelectedScriptTopic] =
    useState<ScriptTopic>("Willingness to pay ₦500/mo");
  const [generatedScript, setGeneratedScript] = useState<ScriptItem[] | null>(
    null
  );

  const scriptTemplates: Record<ScriptTopic, ScriptItem[]> = {
    "Willingness to pay ₦500/mo": [
      {
        q: "Tell me about the last time you tried to save money.",
        tip: "Tip: Ask about the last time it happened, not hypotheticals.",
      },
      {
        q: "What did you do, step by step?",
        tip: "Tip: Follow the actual behavior, not intentions.",
      },
      {
        q: "What was frustrating about it?",
        tip: "Tip: Let them talk; do not lead them.",
      },
      {
        q: "If a tool did that for you automatically, what would it be worth?",
        tip: "Tip: Anchor on their words, not your price.",
      },
    ],
    "The problem is real": [
      {
        q: "How do you currently manage unexpected emergency expenses?",
        tip: "Tip: Look for painful workarounds they actively employ.",
      },
      {
        q: "When was the last time you ran out of savings mid-month?",
        tip: "Tip: Uncover specific financial strain moments.",
      },
      {
        q: "What tools or apps have you tried using in the past?",
        tip: "Tip: Learn why previous solutions failed.",
      },
    ],
    "WhatsApp is the right channel": [
      {
        q: "Which apps do you open first every morning?",
        tip: "Tip: Verify natural habit loops.",
      },
      {
        q: "How often do you interact with businesses or financial services on WhatsApp?",
        tip: "Tip: Check existing trust and transaction comfort on messaging platforms.",
      },
      {
        q: "Where do you receive financial reminders currently?",
        tip: "Tip: Identify communication channel fatigue.",
      },
    ],
  };

  // --- INTERVIEWS / NOTES STATE ---
  const [interviewee, setInterviewee] = useState<string>("");
  const [segmentTag, setSegmentTag] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");
  const [stance, setStance] = useState<StanceType>("Supports");
  const [interviewNotes, setInterviewNotes] = useState<InterviewNote[]>([
    {
      id: 1,
      name: "Chidi",
      segment: "Okada rider",
      quote: "“If it just took a little each trip, I would not even miss it.”",
      stance: "Supports",
    },
    {
      id: 2,
      name: "Funke",
      segment: "Market trader",
      quote: "“Keeping cash in a box is my biggest worry.”",
      stance: "Supports",
    },
    {
      id: 3,
      name: "Yaw",
      segment: "Delivery gig",
      quote: "“I might use it, but I really want investing too.”",
      stance: "Neutral",
    },
  ]);

  // --- SURVEYS STATE ---
  const [isCollecting, setIsCollecting] = useState<boolean>(true);

  // --- MVP FEEDBACK STATE ---
  const [feedbackViewMode, setFeedbackViewMode] = useState<
    "raw" | "loading" | "synthesized"
  >("raw");

  const rawFeedbackList: RawFeedback[] = [
    {
      id: 1,
      type: "Interview",
      author: "Chidi",
      quote: "I would need to be sure my money is safe before I put it in.",
    },
    {
      id: 2,
      type: "In-app",
      author: "Beta user",
      quote: "Love the round-ups. Can it round up every ride automatically?",
    },
    {
      id: 3,
      type: "Email",
      author: "Waitlist",
      quote: "Do you also let me invest what I save?",
    },
    {
      id: 4,
      type: "Interview",
      author: "Funke",
      quote: "Who is behind this app? I need to trust the people.",
    },
  ];

  const synthesizedInsights: SynthesizedInsight[] = [
    {
      id: 1,
      iconType: "diamond",
      title: "Trust is the real blocker, not the feature set",
      sourcesText: "Mentioned 14× across 9 sources",
    },
    {
      id: 2,
      iconType: "arrow",
      title: "Round-ups on each transaction is the most-wanted mechanic",
      sourcesText: "Mentioned 11× across 7 sources",
    },
    {
      id: 3,
      iconType: "smile",
      title: "Investing keeps coming up as a fast follow",
      sourcesText: "Mentioned 8× across 6 sources",
    },
  ];

  // --- EVENT HANDLERS ---
  const handleSynthesizeClick = (): void => {
    setFeedbackViewMode("loading");
    setTimeout(() => {
      setFeedbackViewMode("synthesized");
    }, 2500);
  };

  const handleSendToRoadmap = (insightTitle: string): void => {
    setToast({
      show: true,
      message: `Sent “${insightTitle}” to your roadmap.`,
    });
  };

  const handlePublishSmokeTest = (): void => {
    const newTest: SmokeTest = {
      id: Date.now(),
      name: smokeFormData.heroHeadline || "New Smoke Test",
      status: "Live",
      visits: "0",
      signups: "0",
      conversion: "0.0%",
    };
    setSmokeTestsList([newTest, ...smokeTestsList]);
    setSmokeTestView("list");
    setWizardStep(1);
    setToast({
      show: true,
      message: "Smoke test created and published successfully!",
    });
  };

  const handleSaveInterviewNote = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!interviewee.trim() && !noteText.trim()) return;

    const newNote: InterviewNote = {
      id: Date.now(),
      name: interviewee || "Anonymous",
      segment: segmentTag || "General",
      quote: noteText.startsWith("“") ? noteText : `“${noteText}”`,
      stance: stance,
    };

    setInterviewNotes([newNote, ...interviewNotes]);
    setInterviewee("");
    setSegmentTag("");
    setNoteText("");
    setStance("Supports");
    setToast({ show: true, message: "Interview note saved." });
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#2c3531] flex flex-col md:flex-row relative font-sans">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16">
        {/* GLOBAL TOAST NOTIFICATION */}
        {toast.show && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-[#0e271f] text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#1f4236]">
              <div className="flex items-center justify-center text-emerald-400 font-bold text-sm">
                ✓
              </div>
              <span className="font-medium text-sm tracking-wide text-gray-100">
                {toast.message}
              </span>
            </div>
          </div>
        )}

        {/* HEADER / NAVIGATION BAR */}
        <header className="sticky top-0 z-40 bg-[#f5f7f5]/95 backdrop-blur-sm border-b border-gray-200/70 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="hover:text-gray-700 cursor-pointer">
                Workspace
              </span>
              <span>/</span>
              <span className="font-semibold text-gray-900">Validation Hub</span>
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
                className="relative p-2 sm:p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
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
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      if (tab === "Smoke tests") {
                        setSmokeTestView("list");
                        setWizardStep(1);
                      }
                    }}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
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

        {/* MAIN CONTENT AREA */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full">
          {/* ==================== OVERVIEW TAB ==================== */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                  Validation Hub
                </h1>
                <p className="text-gray-500 mt-1 text-sm sm:text-base">
                  Prove it before you build it.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-[#1e4836]">
                    3
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    Validated
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-[#9d362b]">
                    1
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    Invalidated
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-[#a47127]">
                    2
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    Untested
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d3732]">
                    2
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    Live experiments
                  </span>
                </div>
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-[#2d3732]">
                    284
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
                    Responses collected
                  </span>
                </div>
              </div>

              <div className="bg-[#0e271f] text-white rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start md:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#b89d5f] text-[#1c180e] flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm sm:text-base">
                      Your riskiest untested assumption
                    </h3>
                    <p className="text-gray-300 text-xs sm:text-sm mt-0.5 italic">
                      “Gig workers will pay ₦500 per month for automated
                      savings.”
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("Assumptions")}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all shrink-0 self-start md:self-auto"
                >
                  Design experiment
                </button>
              </div>
            </div>
          )}

          {/* ==================== SMOKE TESTS TAB ==================== */}
          {activeTab === "Smoke tests" && (
            <div>
              {smokeTestView === "list" ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
                      Smoke tests
                    </h1>
                    <button
                      onClick={() => {
                        setSmokeTestView("create");
                        setWizardStep(1);
                      }}
                      className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors self-start sm:self-auto"
                    >
                      + New smoke test
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[550px]">
                        <thead>
                          <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-50/50">
                            <th className="py-3.5 px-4 sm:px-6">TEST</th>
                            <th className="py-3.5 px-4 sm:px-6">STATUS</th>
                            <th className="py-3.5 px-4 sm:px-6">VISITS</th>
                            <th className="py-3.5 px-4 sm:px-6">SIGNUPS</th>
                            <th className="py-3.5 px-4 sm:px-6">CONVERSION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                          {smokeTestsList.map((test) => (
                            <tr
                              key={test.id}
                              className="hover:bg-gray-50/60 transition-colors"
                            >
                              <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-900">
                                {test.name}
                              </td>
                              <td className="py-3.5 px-4 sm:px-6">
                                <span
                                  className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium inline-block ${
                                    test.status === "Live"
                                      ? "bg-emerald-100/70 text-emerald-800"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {test.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 text-gray-600">
                                {test.visits}
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 text-gray-600">
                                {test.signups}
                              </td>
                              <td className="py-3.5 px-4 sm:px-6 font-bold text-[#1e4836]">
                                {test.conversion}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl space-y-6 pt-2">
                  <button
                    onClick={() => setSmokeTestView("list")}
                    className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1 font-medium"
                  >
                    ← Cancel
                  </button>

                  <div className="grid grid-cols-3 gap-4 border-b border-gray-200/80 pb-3">
                    <div>
                      <div
                        className={`h-1 rounded-full ${
                          wizardStep >= 1 ? "bg-[#1e4836]" : "bg-gray-200"
                        }`}
                      />
                      <span
                        className={`text-xs mt-2 block font-medium ${
                          wizardStep >= 1 ? "text-[#1e4836]" : "text-gray-400"
                        }`}
                      >
                        Page
                      </span>
                    </div>
                    <div>
                      <div
                        className={`h-1 rounded-full ${
                          wizardStep >= 2 ? "bg-[#1e4836]" : "bg-gray-200"
                        }`}
                      />
                      <span
                        className={`text-xs mt-2 block font-medium ${
                          wizardStep >= 2 ? "text-[#1e4836]" : "text-gray-400"
                        }`}
                      >
                        Goal
                      </span>
                    </div>
                    <div>
                      <div
                        className={`h-1 rounded-full ${
                          wizardStep >= 3 ? "bg-[#1e4836]" : "bg-gray-200"
                        }`}
                      />
                      <span
                        className={`text-xs mt-2 block font-medium ${
                          wizardStep >= 3 ? "text-[#1e4836]" : "text-gray-400"
                        }`}
                      >
                        Launch
                      </span>
                    </div>
                  </div>

                  {wizardStep === 1 && (
                    <div className="space-y-6 pt-2">
                      <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900">
                        Build the page
                      </h2>
                      <div className="space-y-4 sm:space-y-5">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                            Hero headline
                          </label>
                          <input
                            type="text"
                            value={smokeFormData.heroHeadline}
                            onChange={(e) =>
                              setSmokeFormData({
                                ...smokeFormData,
                                heroHeadline: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4836]/20 focus:border-[#1e4836]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                            CTA button text
                          </label>
                          <input
                            type="text"
                            value={smokeFormData.ctaButtonText}
                            onChange={(e) =>
                              setSmokeFormData({
                                ...smokeFormData,
                                ctaButtonText: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-gray-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1e4836]/20 focus:border-[#1e4836]"
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-1">
                          <input
                            type="checkbox"
                            id="fakeDoor"
                            checked={smokeFormData.showFakeDoorPricing}
                            onChange={(e) =>
                              setSmokeFormData({
                                ...smokeFormData,
                                showFakeDoorPricing: e.target.checked,
                              })
                            }
                            className="w-4 h-4 rounded text-[#1e4836] border-gray-300 focus:ring-0"
                          />
                          <label
                            htmlFor="fakeDoor"
                            className="text-xs sm:text-sm text-gray-700 font-medium cursor-pointer"
                          >
                            Show a fake-door pricing section
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-200/60">
                        <button
                          onClick={() => setSmokeTestView("list")}
                          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setWizardStep(2)}
                          className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-6 pt-2">
                      <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900">
                        Set the goal
                      </h2>
                      <div className="space-y-4 sm:space-y-5">
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                            Success metric
                          </label>
                          <select
                            value={smokeFormData.successMetric}
                            onChange={(e) =>
                              setSmokeFormData({
                                ...smokeFormData,
                                successMetric: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-[#b89d5f] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-gray-800 text-xs sm:text-sm focus:outline-none"
                          >
                            <option value="Email signup">Email signup</option>
                            <option value="CTA click">CTA click</option>
                            <option value="Preorder click">Preorder click</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                            Target conversion
                          </label>
                          <input
                            type="text"
                            value={smokeFormData.targetConversion}
                            onChange={(e) =>
                              setSmokeFormData({
                                ...smokeFormData,
                                targetConversion: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-gray-800 text-xs sm:text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-200/60">
                        <button
                          onClick={() => setWizardStep(1)}
                          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setWizardStep(3)}
                          className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <div className="space-y-6 pt-2">
                      <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900">
                        Launch
                      </h2>
                      <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                          Page slug
                        </label>
                        <div className="flex rounded-xl border border-gray-300 bg-white overflow-hidden">
                          <span className="bg-gray-50 text-gray-500 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm border-r border-gray-200 font-medium flex items-center shrink-0">
                            cofoundaz.site/
                          </span>
                          <input
                            type="text"
                            value={smokeFormData.pageSlug}
                            onChange={(e) =>
                              setSmokeFormData({
                                ...smokeFormData,
                                pageSlug: e.target.value,
                              })
                            }
                            className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-gray-800 text-xs sm:text-sm focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-gray-200/60">
                        <button
                          onClick={() => setWizardStep(2)}
                          className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={handlePublishSmokeTest}
                          className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm"
                        >
                          Publish page
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== INTERVIEW SCRIPTS TAB ==================== */}
          {activeTab === "Interview scripts" && (
            <div className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
                Interview scripts
              </h1>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 space-y-4 shadow-2xs">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                  Generate a script for
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <select
                    value={selectedScriptTopic}
                    onChange={(e) =>
                      setSelectedScriptTopic(e.target.value as ScriptTopic)
                    }
                    className="flex-1 bg-white border border-[#b89d5f] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-gray-800 text-xs sm:text-sm focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="Willingness to pay ₦500/mo">
                      Willingness to pay ₦500/mo
                    </option>
                    <option value="The problem is real">
                      The problem is real
                    </option>
                    <option value="WhatsApp is the right channel">
                      WhatsApp is the right channel
                    </option>
                  </select>

                  <button
                    onClick={() =>
                      setGeneratedScript(scriptTemplates[selectedScriptTopic])
                    }
                    className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0"
                  >
                    <span>✦</span>
                    <span>Generate script</span>
                  </button>
                </div>
              </div>

              {generatedScript && (
                <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-200/80 space-y-6 shadow-2xs">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                    Draft script
                  </h2>
                  <div className="space-y-5 sm:space-y-6">
                    {generatedScript.map((item, index) => (
                      <div key={index} className="space-y-1">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {item.q}
                        </p>
                        <p className="text-xs sm:text-sm text-[#a48439] font-medium">
                          {item.tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== INTERVIEWS TAB ==================== */}
          {activeTab === "Interviews" && (
            <div className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
                Interview notes
              </h1>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base mb-4">
                    New note
                  </h2>
                  <form
                    onSubmit={handleSaveInterviewNote}
                    className="space-y-4"
                  >
                    <input
                      type="text"
                      placeholder="Interviewee"
                      value={interviewee}
                      onChange={(e) => setInterviewee(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Segment tag"
                      value={segmentTag}
                      onChange={(e) => setSegmentTag(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 focus:outline-none"
                    />
                    <textarea
                      placeholder="Notes and key quotes..."
                      rows={4}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-800 focus:outline-none resize-none"
                    />
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {(
                        ["Supports", "Contradicts", "Neutral"] as StanceType[]
                      ).map((st) => (
                        <button
                          type="button"
                          key={st}
                          onClick={() => setStance(st)}
                          className={`py-2 px-2 sm:px-3 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all ${
                            stance === st
                              ? st === "Supports"
                                ? "border-[#1e4836] text-[#1e4836] bg-emerald-50/30"
                                : st === "Contradicts"
                                ? "border-[#9d362b] text-[#9d362b] bg-red-50/30"
                                : "border-gray-400 text-gray-800 bg-gray-100"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm mt-2"
                    >
                      Save note
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                  {interviewNotes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4"
                    >
                      <div className="space-y-2">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          {note.name}{" "}
                          <span className="font-normal text-gray-500">
                            · {note.segment}
                          </span>
                        </h3>
                        <p className="text-gray-600 italic text-xs sm:text-sm leading-relaxed">
                          {note.quote}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 self-start ${
                          note.stance === "Supports"
                            ? "bg-[#e2ede6] text-[#1e4836]"
                            : note.stance === "Contradicts"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {note.stance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== SURVEYS TAB ==================== */}
          {activeTab === "Surveys" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
                  Surveys
                </h1>
                <button
                  onClick={() => {
                    setIsCollecting(!isCollecting);
                    setToast({
                      show: true,
                      message: !isCollecting
                        ? "Survey collection resumed."
                        : "Survey collection stopped.",
                    });
                  }}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-xl text-xs sm:text-sm self-start sm:self-auto"
                >
                  {isCollecting ? "Stop collecting" : "Resume collecting"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 space-y-6 shadow-2xs">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Pricing survey
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      3 questions · 142 responses · 71% completion
                    </p>
                  </div>

                  <div className="bg-[#f2f6f3] rounded-2xl p-4 flex items-center justify-between gap-4 border border-[#e3ebe5]">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-xs text-gray-500 font-medium block">
                        Share link
                      </span>
                      <span className="font-bold text-[#1e4836] text-xs sm:text-sm tracking-wide truncate block">
                        kolo.link/s/pr
                      </span>
                    </div>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#0e271f] rounded-xl flex flex-col justify-between p-2.5 shrink-0">
                      <div className="flex justify-between items-center">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-2xs border-2 border-white/90" />
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-2xs border-2 border-white/90" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-2xs border-2 border-white/90" />
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-2xs bg-[#b89d5f]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 bg-white rounded-2xl p-5 sm:p-8 border border-gray-200/80 space-y-6 shadow-2xs">
                  <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                    Would you pay ₦500/mo?
                  </h2>
                  <div className="space-y-5 sm:space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                        <span className="text-gray-700">Definitely</span>
                        <span className="font-bold text-gray-900">41%</span>
                      </div>
                      <div className="w-full bg-[#ebf0ec] rounded-full h-2.5 sm:h-3 overflow-hidden">
                        <div
                          className="bg-[#1e4836] h-full rounded-full"
                          style={{ width: "41%" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                        <span className="text-gray-700">Maybe</span>
                        <span className="font-bold text-gray-900">38%</span>
                      </div>
                      <div className="w-full bg-[#ebf0ec] rounded-full h-2.5 sm:h-3 overflow-hidden">
                        <div
                          className="bg-[#b89d5f] h-full rounded-full"
                          style={{ width: "38%" }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                        <span className="text-gray-700">No</span>
                        <span className="font-bold text-gray-900">21%</span>
                      </div>
                      <div className="w-full bg-[#ebf0ec] rounded-full h-2.5 sm:h-3 overflow-hidden">
                        <div
                          className="bg-[#b84d3b] h-full rounded-full"
                          style={{ width: "21%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== ASSUMPTIONS TAB ==================== */}
          {activeTab === "Assumptions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
                  Assumptions
                </h1>
                <button className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-3.5 py-2 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm">
                  + Add assumption
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 space-y-4 shadow-2xs">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm tracking-wide uppercase border-b border-gray-100 pb-3">
                    DESIRABILITY
                  </h3>
                  <div className="bg-[#f9faf8] rounded-xl p-3.5 sm:p-4 border border-gray-100 space-y-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">
                      Gig workers want automatic daily micro-savings.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        Validated
                      </span>
                      <button
                        onClick={() =>
                          setToast({
                            show: true,
                            message: "Drafting an experiment for that assumption.",
                          })
                        }
                        className="text-xs text-[#b89d5f] font-semibold"
                      >
                        Design exp.
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 space-y-4 shadow-2xs">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm tracking-wide uppercase border-b border-gray-100 pb-3">
                    VIABILITY
                  </h3>
                  <div className="bg-[#f9faf8] rounded-xl p-3.5 sm:p-4 border border-gray-100 space-y-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">
                      Users will pay ₦500/month subscription.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        Testing
                      </span>
                      <button
                        onClick={() =>
                          setToast({
                            show: true,
                            message: "Drafting an experiment for that assumption.",
                          })
                        }
                        className="text-xs text-[#b89d5f] font-semibold"
                      >
                        Design exp.
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 space-y-4 shadow-2xs col-span-1 sm:col-span-2 lg:col-span-1">
                  <h3 className="font-bold text-gray-900 text-xs sm:text-sm tracking-wide uppercase border-b border-gray-100 pb-3">
                    FEASIBILITY
                  </h3>
                  <div className="bg-[#f9faf8] rounded-xl p-3.5 sm:p-4 border border-gray-100 space-y-3">
                    <p className="text-xs sm:text-sm font-medium text-gray-800">
                      Bank partner API supports micro-debits under ₦100.
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="bg-red-100 text-red-800 text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                        Invalidated
                      </span>
                      <button
                        onClick={() =>
                          setToast({
                            show: true,
                            message: "Drafting an experiment for that assumption.",
                          })
                        }
                        className="text-xs text-[#b89d5f] font-semibold"
                      >
                        Design exp.
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== MVP FEEDBACK TAB ==================== */}
          {activeTab === "MVP feedback" && (
            <div className="space-y-6">
              {/* Header with Title and AI Synthesize Action Button */}
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-gray-900 tracking-tight">
                  MVP feedback
                </h1>

                <button
                  onClick={handleSynthesizeClick}
                  disabled={feedbackViewMode === "loading"}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] disabled:opacity-50 text-[#1c180e] font-semibold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-2xs shrink-0"
                >
                  <span>✦</span>
                  <span>Synthesize insights</span>
                </button>
              </div>

              {/* STATE 1: RAW FEEDBACK LIST */}
              {feedbackViewMode === "raw" && (
                <div className="space-y-3">
                  {rawFeedbackList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="bg-[#f4efe3] text-[#8a723b] text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">
                          {item.type}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-gray-500">
                          {item.author}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm sm:text-base font-normal">
                        {item.quote}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* STATE 2: LOADING SYNTHESIS */}
              {feedbackViewMode === "loading" && (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-12 sm:p-20 flex flex-col items-center justify-center text-center shadow-2xs">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-gray-200 border-t-[#b89d5f] rounded-full animate-spin mb-4 sm:mb-6" />
                  <p className="text-lg sm:text-xl font-serif text-gray-800 font-medium">
                    Reading every note for patterns...
                  </p>
                </div>
              )}

              {/* STATE 3: SYNTHESIZED INSIGHTS */}
              {feedbackViewMode === "synthesized" && (
                <div className="space-y-3">
                  {synthesizedInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        {/* Icon Container */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#e3eae5] flex items-center justify-center text-[#1e4836] shrink-0">
                          {insight.iconType === "diamond" && (
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#1e4836] rotate-45 rounded-xs" />
                          )}
                          {insight.iconType === "arrow" && (
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M7 17L17 7M17 7H7M17 7V17"
                              />
                            </svg>
                          )}
                          {insight.iconType === "smile" && (
                            <svg
                              className="w-4 h-4 sm:w-5 sm:h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                            {insight.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 font-medium">
                            {insight.sourcesText}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleSendToRoadmap(insight.title)}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-colors shrink-0 shadow-2xs self-end sm:self-auto"
                      >
                        Send to roadmap
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}