"use client";

import React, { useState } from "react";
import { 
  Bell, 
  UserPlus, 
  Sparkles, 
  ChevronDown,
  Send
} from "lucide-react";

type ReadinessTab =
  | "Readiness score"
  | "Deck analyzer"
  | "Pitch practice"
  | "Q&A bank"
  | "Metrics"
  | "Investor updates";

type PitchState = "setup" | "chat" | "score";

interface QAItem {
  id: number;
  question: string;
  status: 'Prepared' | 'Needs work';
  answer: string;
}

const initialQAData: QAItem[] = [
  {
    id: 1,
    question: "Why you, why now?",
    status: "Prepared",
    answer: "I have spent six years moving money for riders in Lagos, and mobile money penetration just crossed the threshold that makes automatic round-ups viable at our price point."
  },
  {
    id: 2,
    question: "What is your unfair advantage?",
    status: "Prepared",
    answer: "A trust network of 340 agents who already handle cash for these workers daily. Competitors have to buy distribution; we inherited it."
  },
  {
    id: 3,
    question: "How big can this get?",
    status: "Prepared",
    answer: "18M informal workers in Nigeria alone, with a ₦500 monthly ARPU. Even 2% penetration is a ₦2.1B annual business."
  },
  {
    id: 4,
    question: "What happens if PiggyVest moves down-market?",
    status: "Prepared",
    answer: "They are optimized for salaried, bank-linked users. Serving cash-first riders needs agents on the ground, which is a cost structure they have avoided for five years."
  },
  {
    id: 5,
    question: "What are your unit economics?",
    status: "Needs work",
    answer: "No answer prepared yet. Ask your AI Co-Founder to draft one from your workspace."
  },
  {
    id: 6,
    question: "Why will users keep paying after month three?",
    status: "Prepared",
    answer: "Retention at day 30 is 62%, driven by goal wallets. Once a rider has a named goal with a balance, churn drops sharply."
  },
  {
    id: 7,
    question: "What is the biggest risk to this business?",
    status: "Needs work",
    answer: "No answer prepared yet. Ask your AI Co-Founder to draft one from your workspace."
  },
  {
    id: 8,
    question: "How will you spend this round?",
    status: "Prepared",
    answer: "Eighteen months of runway: two engineers, agent expansion into Ibadan, and the payments licence."
  }
];

export default function PitchPracticeFullApp() {
  const [activeTab, setActiveTab] = useState<ReadinessTab>("Investor updates");
  
  // Investor updates state
  const [isDraftingUpdate, setIsDraftingUpdate] = useState(false);

  // Pitch practice states
  const [pitchState, setPitchState] = useState<PitchState>("setup");
  const [selectedPersona, setSelectedPersona] = useState("Skeptical seed VC");
  const [selectedIntensity, setSelectedIntensity] = useState("Warm");
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);
  const [isIntensityOpen, setIsIntensityOpen] = useState(false);
  
  // Q&A Bank state
  const [openQAId, setOpenQAId] = useState<number | null>(8);

  // Chat simulation state
  const [messages, setMessages] = useState<Array<{ sender: "ai" | "user"; text: string }>>([
    { sender: "ai", text: "Again, and this time lead with the number." }
  ]);
  const [userInput, setUserInput] = useState("");
  const [chatTurn, setChatTurn] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages = [...messages, { sender: "user" as const, text: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setChatTurn(chatTurn + 1);

    setTimeout(() => {
      if (chatTurn === 0) {
        setMessages([
          ...newMessages,
          { sender: "ai", text: "Again, and this time lead with the number." }
        ]);
      } else {
        setMessages([
          ...newMessages,
          { sender: "ai", text: "Got it. How do you plan to acquire your next 1,000 customers efficiently?" }
        ]);
      }
    }, 1000);
  };

  const preparedCount = initialQAData.filter(item => item.status === 'Prepared').length;

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1a1a1a] flex flex-col font-body relative selection:bg-[#e2ede6] selection:text-[#1e4836]">
      
      {/* TOAST NOTIFICATION POPUP */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e271f] text-white px-5 py-3 rounded-modal shadow-raised flex items-center gap-3 border border-[#23483b] animate-bounce">
          <div className="w-5 h-5 rounded-full bg-[#1e4836] flex items-center justify-center text-white text-xs font-bold">
            ✓
          </div>
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-green-300" />
            {toastMessage}
          </span>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-sage-200 shadow-card w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-sage-500 font-medium">
            <span className="hover:text-sage-800 cursor-pointer">Workspace</span>
            <span>/</span>
            <span className="font-semibold text-sage-900">Investor Readiness</span>
          </div>

          <div className="flex items-center gap-2 md:gap-3 ml-auto">
            <div className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 rounded-full text-xs md:text-sm font-medium flex items-center gap-1.5 border border-[#d2e2d8]">
              <span>Health</span>
              <span className="font-display font-bold text-sm md:text-base text-[#0e271f]">72</span>
              <span className="text-xs">↑</span>
            </div>

            <button
              aria-label="Notifications"
              className="relative p-2.5 rounded-full bg-sage-100 border border-sage-200 text-sage-700 hover:bg-sage-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            <button className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-card text-xs md:text-sm transition-colors flex items-center gap-1 cursor-pointer shadow-card">
              <UserPlus className="w-4 h-4" />
              <span>+ Invite</span>
            </button>
          </div>
        </div>

        {/* SUB NAVIGATION TABS */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-3 pt-1">
          <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {(
              [
                "Readiness score",
                "Deck analyzer",
                "Pitch practice",
                "Q&A bank",
                "Metrics",
                "Investor updates",
              ] as ReadinessTab[]
            ).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#faedcc] text-[#522F1A] font-semibold"
                      : "bg-sage-100 text-sage-600 hover:bg-sage-200 hover:text-sage-900"
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
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1 w-full flex flex-col justify-center">
        
        {activeTab === "Investor updates" && (
          <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-display font-semibold text-sage-900">Investor updates</h1>
              {!isDraftingUpdate && (
                <button 
                  onClick={() => setIsDraftingUpdate(true)}
                  className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-4 py-2.5 rounded-card text-sm transition cursor-pointer flex items-center gap-2 shadow-card"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Draft this month&apos;s</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Draft card appears when drafting */}
              {isDraftingUpdate && (
                <div className="bg-white border border-sage-200/95 rounded-[24px] p-6 md:p-8 shadow-card space-y-5 animate-fadeIn">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-[#9C5B34] uppercase tracking-wider">Draft · July 2026</span>
                    <h3 className="text-xl font-display font-bold text-sage-900">Kolo, July: retention up, pricing test live</h3>
                  </div>
                  <p className="text-sm text-sage-700 leading-relaxed font-medium">
                    Highlights: 1,240 active savers (+18% MoM), ₦1.6M monthly revenue, and 62% 30-day retention. We launched the pricing experiment and 41% of surveyed riders chose the ₦500 tier. Asks: intros to two cooperatives in Ibadan, and a payments partner who can cut our transfer fees.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setIsDraftingUpdate(false);
                        triggerToast("Update sent to 6 investors.");
                      }}
                      className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-4 py-2.5 rounded-card text-sm transition cursor-pointer shadow-card"
                    >
                      Send to 6 investors
                    </button>
                    <button 
                      onClick={() => setIsDraftingUpdate(false)}
                      className="bg-white border border-sage-300 hover:bg-sage-50 text-sage-700 font-semibold px-4 py-2.5 rounded-card text-sm transition cursor-pointer"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {/* Past updates */}
              {[
                { month: "JUN", title: "Kolo, June: agent network doubled", sub: "Sent to 6 investors · 5 opened" },
                { month: "MAY", title: "Kolo, May: MVP live in Lagos", sub: "Sent to 5 investors · 5 opened" },
                { month: "APR", title: "Kolo, April: first 100 savers", sub: "Sent to 4 investors · 3 opened" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-sage-200/95 rounded-modal p-5 flex items-center justify-between shadow-card hover:border-sage-300 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-card bg-sage-100 flex items-center justify-center font-bold text-xs text-sage-600">
                      {item.month}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-sage-900">{item.title}</h4>
                      <p className="text-xs text-sage-500 font-medium">{item.sub}</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-[#1e4836] hover:text-[#0e271f] cursor-pointer px-3 py-1.5 rounded-input hover:bg-sage-50 transition">
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Metrics" && (
          <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto w-full">
            <div className="space-y-1 mb-6">
              <h1 className="text-3xl font-display font-semibold text-sage-900">The metrics they will ask for</h1>
              <p className="text-sm text-sage-500 font-medium">Yours, next to what pre-seed fintech investors typically expect.</p>
            </div>

            <div className="bg-white border border-sage-200/95 rounded-[24px] shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-sage-200 text-sage-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-4 px-6">Metric</th>
                      <th className="py-4 px-6">You</th>
                      <th className="py-4 px-6">Benchmark</th>
                      <th className="py-4 px-6 text-right">Read</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100 text-sm">
                    {[
                      { name: "Monthly revenue", you: "₦1.6M", benchmark: "₦1.0M to ₦3.0M", status: "At par", statusBg: "bg-[#faedcc] text-[#6E4326]" },
                      { name: "MoM growth", you: "18%", benchmark: "15%", status: "Above", statusBg: "bg-[#e2ede6] text-[#1e4836]" },
                      { name: "30-day retention", you: "62%", benchmark: "40%", status: "Above", statusBg: "bg-[#e2ede6] text-[#1e4836]" },
                      { name: "CAC", you: "₦240", benchmark: "₦300", status: "Above", statusBg: "bg-[#e2ede6] text-[#1e4836]" },
                      { name: "Burn multiple", you: "3.1x", benchmark: "2.0x", status: "Below", statusBg: "bg-[#fce8e6] text-[#a51d24]" },
                      { name: "Runway", you: "8.4 mo", benchmark: "12 mo", status: "Below", statusBg: "bg-[#fce8e6] text-[#a51d24]" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-sage-50/60 transition-colors">
                        <td className="py-4 px-6 font-semibold text-sage-900">{row.name}</td>
                        <td className="py-4 px-6 font-display font-bold text-sage-900">{row.you}</td>
                        <td className="py-4 px-6 text-sage-500 font-medium">{row.benchmark}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${row.statusBg}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#faedcc]/40 border border-[#faedcc] rounded-modal p-5 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#8A5330] shrink-0 mt-0.5" />
              <p className="text-sm text-sage-800 font-medium leading-relaxed">
                <strong className="font-bold text-sage-900">AI note:</strong> Your retention is your strongest number. Lead with it, then use CAC to show the growth is repeatable.
              </p>
            </div>
          </div>
        )}

        {activeTab === "Deck analyzer" && (
          <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto w-full">
            <h1 className="text-3xl font-display font-semibold text-sage-900">Deck analyzer</h1>
            <p className="text-sm text-sage-500">Upload your pitch deck to get instant AI feedback and slide coverage scoring.</p>
          </div>
        )}

        {activeTab === "Pitch practice" && (
          <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto w-full">
            <div className="space-y-1 mb-6">
              <h1 className="text-3xl font-display font-semibold text-sage-900">Pitch practice</h1>
              <p className="text-sm text-sage-500">Rehearse here, raise out there.</p>
            </div>

            {pitchState === "setup" && (
              <div className="bg-white border border-sage-200/95 rounded-[24px] p-8 shadow-card space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-sage-700 uppercase tracking-wider">Investor persona</label>
                    <div 
                      onClick={() => {
                        setIsPersonaOpen(!isPersonaOpen);
                        setIsIntensityOpen(false);
                      }}
                      className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 flex items-center justify-between cursor-pointer hover:border-[#9C5B34] transition"
                    >
                      <span className="text-sm font-medium text-sage-900">{selectedPersona}</span>
                      <ChevronDown className="w-4 h-4 text-sage-500" />
                    </div>

                    {isPersonaOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sage-200 rounded-card shadow-raised z-20 overflow-hidden">
                        {[
                          "Skeptical seed VC",
                          "Impact-focused fund",
                          "Angel, first cheque",
                        ].map((persona) => (
                          <div 
                            key={persona}
                            onClick={() => {
                              setSelectedPersona(persona);
                              setIsPersonaOpen(false);
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-sage-100 font-medium ${
                              selectedPersona === persona ? "bg-sage-200 text-sage-900" : "text-sage-700"
                            }`}
                          >
                            {persona}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 relative">
                    <label className="text-xs font-bold text-sage-700 uppercase tracking-wider">Intensity</label>
                    <div 
                      onClick={() => {
                        setIsIntensityOpen(!isIntensityOpen);
                        setIsPersonaOpen(false);
                      }}
                      className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 flex items-center justify-between cursor-pointer hover:border-[#9C5B34] transition"
                    >
                      <span className="text-sm font-medium text-sage-900">{selectedIntensity}</span>
                      <ChevronDown className="w-4 h-4 text-sage-500" />
                    </div>

                    {isIntensityOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sage-200 rounded-card shadow-raised z-20 overflow-hidden">
                        {[
                          "Warm",
                          "Realistic",
                          "Grilling",
                        ].map((intensity) => (
                          <div 
                            key={intensity}
                            onClick={() => {
                              setSelectedIntensity(intensity);
                              setIsIntensityOpen(false);
                            }}
                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-sage-100 font-medium ${
                              selectedIntensity === intensity ? "bg-sage-200 text-sage-900" : "text-sage-700"
                            }`}
                          >
                            {intensity}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <button
                  onClick={() => {
                    setPitchState("chat");
                    setMessages([{ sender: "ai", text: "Walk me through it in two minutes. Start with why this exists." }]);
                    setChatTurn(0);
                  }}
                  className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-5 py-3 rounded-card text-sm transition cursor-pointer shadow-card"
                >
                  Start the session
                </button>
              </div>
            )}

            {pitchState === "chat" && (
              <div className="bg-white border border-sage-200/95 rounded-[24px] p-6 md:p-8 shadow-card space-y-6">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {messages.map((msg, index) => (
                    <div 
                      key={index}
                      className={`max-w-md p-4 rounded-modal text-sm leading-relaxed ${
                        msg.sender === "ai"
                          ? "bg-sage-100 text-sage-800 rounded-tl-xs"
                          : "bg-[#9C5B34] text-white ml-auto rounded-tr-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-center gap-3 pt-4 border-t border-sage-100">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Your answer..."
                    className="flex-1 bg-white border border-sage-300 rounded-card px-4 py-3 text-sm text-sage-900 focus:outline-none focus:border-[#9C5B34]"
                  />
                  <button
                    type="submit"
                    className="bg-[#1b3224] hover:bg-[#14261b] text-white px-5 py-3 rounded-card text-sm font-semibold transition cursor-pointer flex items-center gap-2 shadow-card"
                  >
                    <span>Send</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div>
                  <button
                    onClick={() => setPitchState("score")}
                    className="text-xs font-semibold text-red-700 hover:text-red-800 cursor-pointer"
                  >
                    End and score me
                  </button>
                </div>
              </div>
            )}

            {pitchState === "score" && (
              <div className="bg-white border border-sage-200/95 rounded-[24px] p-8 shadow-card space-y-6 animate-fadeIn">
                <h2 className="text-xl font-display font-bold text-sage-900">Session scorecard</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-sage-50 border border-sage-200/80 rounded-modal p-5 text-center space-y-1">
                    <div className="text-2xl md:text-3xl font-display font-bold text-sage-900">7/10</div>
                    <div className="text-xs text-sage-500 font-medium">Clarity</div>
                  </div>
                  <div className="bg-sage-50 border border-sage-200/80 rounded-modal p-5 text-center space-y-1">
                    <div className="text-2xl md:text-3xl font-display font-bold text-sage-900">5/10</div>
                    <div className="text-xs text-sage-500 font-medium">Traction proof</div>
                  </div>
                  <div className="bg-sage-50 border border-sage-200/80 rounded-modal p-5 text-center space-y-1">
                    <div className="text-2xl md:text-3xl font-display font-bold text-sage-900">8/10</div>
                    <div className="text-xs text-sage-500 font-medium">Market</div>
                  </div>
                  <div className="bg-sage-50 border border-sage-200/80 rounded-modal p-5 text-center space-y-1">
                    <div className="text-2xl md:text-3xl font-display font-bold text-sage-900">6/10</div>
                    <div className="text-xs text-sage-500 font-medium">The ask</div>
                  </div>
                </div>

                <p className="text-sm text-sage-600 leading-relaxed font-medium">
                  Your problem framing landed. Where you lost ground was traction: you described activity, not evidence. Next time lead with the number that proves demand, then explain how you got it.
                </p>

                <div>
                  <button
                    onClick={() => {
                      setPitchState("chat");
                      setMessages([{ sender: "ai", text: "Again, and this time lead with the number." }]);
                      setChatTurn(0);
                    }}
                    className="bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold px-5 py-3 rounded-card text-sm transition cursor-pointer shadow-card"
                  >
                    Run it again
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === "Q&A bank" && (
          <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto w-full">
            <div className="flex items-baseline justify-between mb-2">
              <h1 className="text-3xl font-display font-semibold text-sage-900">Investor Q&A bank</h1>
              <span className="text-sm text-sage-500 font-medium">{preparedCount} of {initialQAData.length} prepared</span>
            </div>

            <div className="space-y-3">
              {initialQAData.map((item) => {
                const isOpen = openQAId === item.id;
                return (
                  <div 
                    key={item.id}
                    className="bg-white border border-sage-200/95 rounded-modal p-5 shadow-card transition-all"
                  >
                    <div 
                      onClick={() => setOpenQAId(isOpen ? null : item.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <h3 className="text-base font-medium text-sage-900">{item.question}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          item.status === 'Prepared' 
                            ? 'bg-[#e2ede6] text-[#1e4836]' 
                            : 'bg-[#fef7e0] text-[#8A5330]'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-lg font-bold text-sage-400 w-5 text-center">
                          {isOpen ? '−' : '+'}
                        </span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-sage-100 space-y-4 animate-fadeIn">
                        <div className="bg-sage-50 border border-sage-200/60 rounded-card p-4 text-sm text-sage-800 leading-relaxed font-medium">
                          {item.answer}
                        </div>
                        <div className="flex items-center gap-6 text-xs font-semibold">
                          <button 
                            onClick={() => triggerToast("Tightening your answer.")}
                            className="text-[#1e4836] hover:text-[#0e271f] flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Tighten this answer</span>
                          </button>
                          <button 
                            onClick={() => {
                              setActiveTab("Pitch practice");
                              setPitchState("chat");
                              setMessages([
                                { sender: "ai", text: `Let's rehearse: "${item.question}". What is your core response?` }
                              ]);
                            }}
                            className="text-[#1e4836] hover:text-[#0e271f] cursor-pointer"
                          >
                            Rehearse it
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab !== "Deck analyzer" && activeTab !== "Pitch practice" && activeTab !== "Q&A bank" && activeTab !== "Metrics" && activeTab !== "Investor updates" && (
          <div className="py-20 text-center space-y-3">
            <h2 className="text-2xl font-display font-semibold text-sage-900">{activeTab}</h2>
            <p className="text-sm text-sage-500">This module is currently being configured.</p>
          </div>
        )}

      </main>
    </div>
  );
}