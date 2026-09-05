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
  | "MVP feedback"
  | "Assessment";

type SubTabName = "Take assessment" | "In progress" | "Past results" | "Compare";

interface ToastState {
  show: boolean;
  message: string;
}

export default function ValidationHub() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Corrected default sub-tab state to "Take assessment" so it opens immediately on click
  const [activeSubTab, setActiveSubTab] = useState<SubTabName>("Take assessment");
  const [toast, setToast] = useState<ToastState>({ show: false, message: "" });

  // Assessment Flow State (0 = Intro, 1 to 9 = Questions, 10 = Results Summary Screen)
  const [assessmentStep, setAssessmentStep] = useState<number>(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<number, string | number | string[]>>({});

  // Expanded card state for Past Results interactive dropdowns
  const [expandedPastResultId, setExpandedPastResultId] = useState<number | null>(null);

  // Dynamic progress percentage mapping based on your requirements:
  // Step 0 (Intro): 10%
  // Step 1 to 9: 11%, 22%, 33%, 44%, 56%, 67%, 78%, 89%, 100%
  const progressPercentages = ["10%", "11%", "22%", "33%", "44%", "56%", "67%", "78%", "89%", "100%"];

  const assessmentQuestions = [
    {
      id: 1,
      section: "Section 1: Product",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "How far along is your product?",
      type: "options",
      options: [
        "Just an idea",
        "A prototype",
        "An MVP that is live",
        "In market with users",
      ],
    },
    {
      id: 2,
      section: "Section 1: Product",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "How confident are you in your core feature set?",
      type: "scale1to5",
      minLabel: "Not at all",
      maxLabel: "Completely",
    },
    {
      id: 3,
      section: "Section 2: Market",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "Which of these have you validated with real people?",
      type: "multiOptions",
      options: [
        "The problem",
        "Willingness to pay",
        "A channel that works",
        "Your pricing",
      ],
    },
    {
      id: 4,
      section: "Section 2: Market",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "How well do you know your target customer?",
      type: "options",
      options: [
        "Still guessing",
        "A rough idea",
        "A clear persona",
        "Deeply, from interviews",
      ],
    },
    {
      id: 5,
      section: "Section 3: Money",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "Roughly how much cash do you have on hand?",
      type: "currency",
    },
    {
      id: 6,
      section: "Section 3: Money",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "What is your monthly net burn?",
      type: "currency",
    },
    {
      id: 7,
      section: "Section 4: Legal",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "Is your company incorporated?",
      type: "options",
      options: ["Not yet", "In progress", "Yes, fully formed"],
    },
    {
      id: 8,
      section: "Section 5: Team",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "How well are your key skill areas covered?",
      type: "scale1to5",
      minLabel: "Not at all",
      maxLabel: "Completely",
    },
    {
      id: 9,
      section: "Section 5: Team",
      subtitle: "Adaptive: I skip anything that doesn't apply to you.",
      question: "Anything else about your team I should factor in?",
      type: "textarea",
    },
  ];

  const pastResultsData = [
    {
      id: 1,
      score: 74,
      title: "Quarterly check-in",
      date: "Jul 20, 2026",
      stage: "Validation stage",
      delta: "+2",
    },
    {
      id: 2,
      score: 72,
      title: "Quarterly check-in",
      date: "Apr 18, 2026",
      stage: "Validation stage",
      delta: "+9",
    },
    {
      id: 3,
      score: 63,
      title: "Kickoff assessment",
      date: "Jan 10, 2026",
      stage: "Idea stage",
      delta: "first",
    },
  ];

  const handleSelectAnswer = (qIndex: number, value: string | number | string[]) => {
    setAssessmentAnswers({
      ...assessmentAnswers,
      [qIndex]: value,
    });
  };

  const handleNextQuestion = () => {
    if (assessmentStep < assessmentQuestions.length) {
      setAssessmentStep(assessmentStep + 1);
    } else if (assessmentStep === assessmentQuestions.length) {
      setAssessmentStep(10);
    }
  };

  const handlePrevQuestion = () => {
    if (assessmentStep > 0 && assessmentStep <= assessmentQuestions.length) {
      setAssessmentStep(assessmentStep - 1);
    }
  };

  const handleSaveAndExit = () => {
    setToast({
      show: true,
      message: "Assessment progress saved. You can resume anytime.",
    });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 4000);
  };

  const currentProgressPercentage = progressPercentages[assessmentStep] || "100%";

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col bg-[#f5f7f5] text-[#2c3531] font-body">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 block bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
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

        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6]">
          <header className="bg-white border-b border-[#EBEBE6] px-3 sm:px-4 md:px-8 py-3.5 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
              >
                C
              </button>
              <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base font-semibold">
                <span className="truncate text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="truncate text-[#1E2923] font-bold">Assessment</h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="bg-[#E3EFE9] text-[#12291F] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 h-[34px]">
                <span>Health</span>
                <span className="font-bold">{assessmentStep === 10 ? "74" : "72"}</span>
                <span className="text-emerald-600 font-bold">↑</span>
              </div>

              <button
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-full border border-[#DCE6E1] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-[#66756F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  5
                </span>
              </button>

              <button className="shrink-0 whitespace-nowrap bg-[#A8894B] text-[#12291F] font-semibold text-xs px-4 h-[36px] rounded-[8px] hover:bg-[#967941] transition-colors">
                <span>+ Invite</span>
              </button>
            </div>
          </header>

          <div className="px-4 md:px-8 py-3 bg-[#F7F7F5]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {(["Take assessment", "In progress", "Past results", "Compare"] as SubTabName[]).map((subTab) => {
                const isActive = activeSubTab === subTab;
                return (
                  <button
                    key={subTab}
                    onClick={() => setActiveSubTab(subTab)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-[#EAD5C6] text-[#1E2923] font-bold shadow-card"
                        : "bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]"
                    }`}
                  >
                    {subTab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* MAIN ASSESSMENT CONTENT */}
        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-12 flex-1 w-full space-y-6">
          {activeSubTab === "Compare" ? (
            /* COMPARE TAB SECTION */
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
                  How your fundamentals have matured
                </h1>
                <p className="text-sage-500 text-sm md:text-base">
                  Your last three assessments, across every dimension.
                </p>
              </div>

              {/* RADAR CHART DISPLAY CARD */}
              <div className="bg-white rounded-modal p-8 md:p-12 border border-sage-200/80 shadow-card flex flex-col md:flex-row items-center justify-center gap-12">
                {/* SVG RADAR CHART */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 200">
                    {/* Background concentric pentagons */}
                    <polygon points="100,20 180,75 150,165 50,165 20,75" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                    <polygon points="100,40 160,85 135,145 65,145 40,85" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                    <polygon points="100,60 140,95 120,125 80,125 60,95" fill="none" stroke="#e5e7eb" strokeWidth="1" />

                    {/* Axis lines */}
                    <line x1="100" y1="100" x2="100" y2="20" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="100" y1="100" x2="180" y2="75" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="100" y1="100" x2="150" y2="165" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="100" y1="100" x2="50" y2="165" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="100" y1="100" x2="20" y2="75" stroke="#e5e7eb" strokeWidth="1" />

                    {/* June assessment polygon */}
                    <polygon points="100,50 155,90 130,150 70,140 45,85" fill="#84a98c" fillOpacity="0.3" stroke="#84a98c" strokeWidth="2" />

                    {/* July assessment polygon */}
                    <polygon points="100,38 168,80 140,155 60,150 32,80" fill="#354f52" fillOpacity="0.2" stroke="#354f52" strokeWidth="2" />

                    {/* This assessment polygon */}
                    <polygon points="100,28 175,76 146,160 54,158 26,76" fill="#9C5B34" fillOpacity="0.15" stroke="#9C5B34" strokeWidth="2" />
                  </svg>
                </div>

                {/* LEGEND */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-sage-700 font-medium">
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-[#84a98c] inline-block"></span>
                    <span>June assessment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-sage-700 font-medium">
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-[#354f52] inline-block"></span>
                    <span>July assessment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-sage-700 font-medium">
                    <span className="w-3.5 h-3.5 rounded-[2px] bg-[#9C5B34] inline-block"></span>
                    <span>This assessment</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSubTab === "Past results" ? (
            /* PAST RESULTS SECTION */
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
                  Past results
                </h1>
                <p className="text-sage-500 text-sm md:text-base">
                  Every calibration, and how your fundamentals moved.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {pastResultsData.map((item) => {
                  const isExpanded = expandedPastResultId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden transition-all"
                    >
                      {/* CARD ROW HEADER */}
                      <div
                        onClick={() => setExpandedPastResultId(isExpanded ? null : item.id)}
                        className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-sage-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-12 h-12 rounded-card bg-[#f0f5f2] border border-[#d2e2d8] text-[#1e4836] flex items-center justify-center font-display font-bold text-lg shadow-card">
                            {item.score}
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-sage-900 text-base md:text-lg">
                              {item.title}
                            </h3>
                            <p className="text-xs md:text-sm text-sage-500">
                              {item.date} · {item.stage}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm font-semibold">
                          <span className="text-[#1e4836]">{item.delta}</span>
                          <span className="text-sage-400 font-bold text-xs">
                            {isExpanded ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      {/* EXPANDED ACCORDION VIEW */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-sage-100 bg-sage-50/30 animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3">
                            <div className="bg-white p-4 rounded-card border border-sage-200/60 shadow-card text-sm flex justify-between items-center">
                              <span className="text-sage-600">Product Validation</span>
                              <span className="font-semibold text-[#1e4836]">Strong (+4)</span>
                            </div>
                            <div className="bg-white p-4 rounded-card border border-sage-200/60 shadow-card text-sm flex justify-between items-center">
                              <span className="text-sage-600">Market Fit</span>
                              <span className="font-semibold text-[#1e4836]">Steady (+2)</span>
                            </div>
                            <div className="bg-white p-4 rounded-card border border-sage-200/60 shadow-card text-sm flex justify-between items-center">
                              <span className="text-sage-600">Runway & Burn</span>
                              <span className="font-semibold text-copper-700">Tight (0)</span>
                            </div>
                            <div className="bg-white p-4 rounded-card border border-sage-200/60 shadow-card text-sm flex justify-between items-center">
                              <span className="text-sage-600">Team Alignment</span>
                              <span className="font-semibold text-[#1e4836]">Optimal (+1)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeSubTab === "In progress" ? (
            /* IN PROGRESS TAB SCREEN */
            <div className="space-y-6 animate-fadeIn">
              <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
                In progress
              </h1>

              <div className="bg-white rounded-modal p-8 border border-sage-200/80 shadow-card space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold tracking-wider text-[#9C5B34] uppercase">
                    Kickoff assessment
                  </span>
                  <h3 className="text-xl md:text-2xl font-display font-semibold text-sage-900">
                    You&apos;re {assessmentStep === 0 ? "10" : parseInt(currentProgressPercentage)}% through. Pick up where you left off.
                  </h3>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full bg-[#d2e2d8]/60 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#1e4836] h-full rounded-full transition-all duration-300"
                    style={{ width: assessmentStep === 0 ? "10%" : currentProgressPercentage }}
                  ></div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      setActiveSubTab("Take assessment");
                      if (assessmentStep === 0) setAssessmentStep(1);
                    }}
                    className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-6 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card"
                  >
                    Resume
                  </button>
                </div>
              </div>
            </div>
          ) : activeSubTab === "Take assessment" ? (
            <>
              {assessmentStep === 0 ? (
                /* INTRO SCREEN */
                <div className="bg-white rounded-modal p-8 md:p-16 border border-sage-200/80 text-center space-y-6 shadow-card">
                  <div className="w-12 h-12 rounded-modal bg-[#e2ede6] text-[#1e4836] mx-auto flex items-center justify-center font-bold text-lg border border-[#d2e2d8]">
                    ⊞
                  </div>

                  <div className="space-y-2 max-w-lg mx-auto">
                    <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
                      Let&apos;s calibrate Kolo
                    </h1>
                    <p className="text-sage-500 text-sm md:text-base leading-relaxed">
                      Honest answers make everything smarter, your score, your roadmap, your advisors. There are no wrong answers, only accurate ones.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setAssessmentStep(1)}
                      className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-8 py-3 rounded-card text-sm transition-all cursor-pointer shadow-card"
                    >
                      Begin
                    </button>
                    <p className="text-xs text-sage-400 mt-3 italic">
                      About 10 minutes. You can pause any time.
                    </p>
                  </div>
                </div>
              ) : assessmentStep === 10 ? (
                /* FINAL SCORE RESULTS SCREEN */
                <div className="bg-white rounded-modal p-8 md:p-16 border border-sage-200/80 text-center space-y-8 shadow-card animate-fadeIn">
                  <div className="w-14 h-14 rounded-full bg-[#1e4836] text-white mx-auto flex items-center justify-center font-bold text-xl shadow-card">
                    ✓
                  </div>

                  <div className="space-y-2 max-w-lg mx-auto">
                    <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
                      Your Health Score is now 74.
                    </h1>
                    <p className="text-sage-500 text-sm md:text-base">
                      Here&apos;s what changed after recalibrating.
                    </p>
                  </div>

                  {/* STATS RECALIBRATION CARDS */}
                  <div className="max-w-md mx-auto space-y-3 pt-2">
                    <div className="bg-white rounded-modal p-4 border border-sage-200/80 shadow-card flex items-center justify-between font-medium text-sm md:text-base">
                      <span className="text-sage-800">Financial</span>
                      <span className="text-[#1e4836] font-semibold">58 → 61</span>
                    </div>
                    <div className="bg-white rounded-modal p-4 border border-sage-200/80 shadow-card flex items-center justify-between font-medium text-sm md:text-base">
                      <span className="text-sage-800">Market</span>
                      <span className="text-[#1e4836] font-semibold">74 → 76</span>
                    </div>
                    <div className="bg-white rounded-modal p-4 border border-sage-200/80 shadow-card flex items-center justify-between font-medium text-sm md:text-base">
                      <span className="text-sage-800">Overall</span>
                      <span className="text-[#1e4836] font-semibold">72 → 74</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setToast({ show: true, message: "Redirecting to your dashboard..." });
                        setTimeout(() => {
                          window.location.href = "/dashboard";
                        }, 1000);
                      }}
                      className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-8 py-3 rounded-card text-sm transition-all cursor-pointer shadow-card"
                    >
                      See my dashboard
                    </button>
                  </div>
                </div>
              ) : (
                /* QUESTION STEPS */
                <div className="space-y-8 animate-fadeIn">
                  {/* SECTION HEADER & PROGRESS BAR */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-sage-500">
                      <span>{assessmentQuestions[assessmentStep - 1].section}</span>
                      <button
                        onClick={handleSaveAndExit}
                        className="text-sage-700 hover:text-sage-900 cursor-pointer"
                      >
                        Save & exit
                      </button>
                    </div>

                    <div className="w-full bg-[#d2e2d8]/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#1e4836] h-full rounded-full transition-all duration-300"
                        style={{ width: currentProgressPercentage }}
                      ></div>
                    </div>

                    <p className="text-xs text-sage-400 italic">
                      {assessmentQuestions[assessmentStep - 1].subtitle}
                    </p>
                  </div>

                  {/* QUESTION CARD */}
                  <div className="space-y-6">
                    <h2 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
                      {assessmentQuestions[assessmentStep - 1].question}
                    </h2>

                    {/* OPTIONS TYPE */}
                    {assessmentQuestions[assessmentStep - 1].type === "options" && (
                      <div className="space-y-3">
                        {assessmentQuestions[assessmentStep - 1].options?.map((opt) => {
                          const isSelected = assessmentAnswers[assessmentStep] === opt;
                          return (
                            <div
                              key={opt}
                              onClick={() => handleSelectAnswer(assessmentStep, opt)}
                              className={`bg-white rounded-modal p-5 border transition-all cursor-pointer shadow-card font-medium text-sm md:text-base ${
                                isSelected
                                  ? "border-[#1e4836] bg-[#f0f5f2] text-[#0e271f]"
                                  : "border-sage-200/80 hover:border-sage-300 text-sage-800"
                              }`}
                            >
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* SCALE 1 TO 5 TYPE */}
                    {assessmentQuestions[assessmentStep - 1].type === "scale1to5" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-5 gap-3">
                          {[1, 2, 3, 4, 5].map((num) => {
                            const isSelected = assessmentAnswers[assessmentStep] === num;
                            return (
                              <div
                                key={num}
                                onClick={() => handleSelectAnswer(assessmentStep, num)}
                                className={`bg-white rounded-modal p-6 text-center border transition-all cursor-pointer shadow-card font-display font-bold text-xl md:text-2xl ${
                                  isSelected
                                    ? "border-[#1e4836] bg-[#f0f5f2] text-[#0e271f]"
                                    : "border-sage-200/80 hover:border-sage-300 text-sage-800"
                                }`}
                              >
                                {num}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-sage-400 px-1">
                          <span>{assessmentQuestions[assessmentStep - 1].minLabel}</span>
                          <span>{assessmentQuestions[assessmentStep - 1].maxLabel}</span>
                        </div>
                      </div>
                    )}

                    {/* MULTI OPTIONS TYPE */}
                    {assessmentQuestions[assessmentStep - 1].type === "multiOptions" && (
                      <div className="space-y-3">
                        {assessmentQuestions[assessmentStep - 1].options?.map((opt) => {
                          const currentSelected = (assessmentAnswers[assessmentStep] as string[] | undefined) || [];
                          const isSelected = currentSelected.includes(opt);
                          return (
                            <div
                              key={opt}
                              onClick={() => {
                                const next = isSelected
                                  ? currentSelected.filter((item: string) => item !== opt)
                                  : [...currentSelected, opt];
                                handleSelectAnswer(assessmentStep, next);
                              }}
                              className={`bg-white rounded-modal p-5 border transition-all cursor-pointer shadow-card font-medium text-sm md:text-base ${
                                isSelected
                                  ? "border-[#1e4836] bg-[#f0f5f2] text-[#0e271f]"
                                  : "border-sage-200/80 hover:border-sage-300 text-sage-800"
                              }`}
                            >
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* CURRENCY TYPE */}
                    {assessmentQuestions[assessmentStep - 1].type === "currency" && (
                      <div className="bg-white rounded-modal p-4 border border-sage-200/80 shadow-card flex items-center">
                        <span className="text-sage-400 text-lg font-medium pr-2">₦</span>
                        <input
                          type="text"
                          value={assessmentAnswers[assessmentStep] || "0"}
                          onChange={(e) => handleSelectAnswer(assessmentStep, e.target.value)}
                          className="w-full bg-transparent text-sage-900 text-lg font-medium focus:outline-none"
                        />
                      </div>
                    )}

                    {/* TEXTAREA TYPE */}
                    {assessmentQuestions[assessmentStep - 1].type === "textarea" && (
                      <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden">
                        <textarea
                          rows={5}
                          placeholder="A sentence or two is plenty..."
                          value={assessmentAnswers[assessmentStep] || ""}
                          onChange={(e) => handleSelectAnswer(assessmentStep, e.target.value)}
                          className="w-full p-4 bg-transparent text-sage-900 text-sm focus:outline-none resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* FOOTER NAVIGATION & STATUS */}
                  <div className="pt-6 border-t border-sage-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
                    <button
                      onClick={handlePrevQuestion}
                      className="text-sage-600 hover:text-sage-900 text-sm font-medium cursor-pointer"
                    >
                      ← Back
                    </button>

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#1e4836]">
                      <span className="w-2 h-2 rounded-full bg-[#1e4836]"></span>
                      <span>Answer saved</span>
                    </div>

                    <button
                      onClick={handleNextQuestion}
                      className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-6 py-2.5 rounded-card text-sm transition-all cursor-pointer shadow-card"
                    >
                      {assessmentStep === assessmentQuestions.length ? "Finish" : "Continue"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-modal p-8 border border-sage-200/80 shadow-card text-center text-sage-500">
              Content for {activeSubTab} coming soon.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
