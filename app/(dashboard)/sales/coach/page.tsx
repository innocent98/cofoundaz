"use client";

import React, { useState } from "react";
import { useSalesApi } from "@/hooks/useSalesApi";

type AICoachSubTab = "Role-play" | "Call prep";
type RolePlayState = "setup" | "chat" | "scorecard";

export default function AICoachPage() {
  const { chatMessages, sendMessageToCoach } = useSalesApi();

  const [aiCoachSubTab, setAiCoachSubTab] = useState<AICoachSubTab>("Role-play");
  const [rolePlayState, setRolePlayState] = useState<RolePlayState>("setup");
  const [selectedPersona, setSelectedPersona] = useState<string>("Skeptical HR lead");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Friendly");
  const [isPersonaOpen, setIsPersonaOpen] = useState<boolean>(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState<boolean>(false);
  const [userInputValue, setUserInputValue] = useState<string>("");

  const handleSendMessage = () => {
    if (!userInputValue.trim()) return;
    sendMessageToCoach(userInputValue);
    setUserInputValue("");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900">AI sales coach</h1>
        <p className="text-sm text-sage-500 font-medium mt-0.5">Rehearse here, win out there.</p>
      </div>

      <div className="flex items-center gap-2">
        {(["Role-play", "Call prep"] as AICoachSubTab[]).map((subTab) => {
          const isActive = aiCoachSubTab === subTab;
          return (
            <button
              key={subTab}
              onClick={() => {
                setAiCoachSubTab(subTab);
                if (subTab === "Role-play" && rolePlayState !== "chat") setRolePlayState("setup");
              }}
              className={`px-4 py-2 rounded-card text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#EAD5C6] text-[#2c220b] shadow-card"
                  : "bg-white text-sage-700 hover:bg-sage-50 border border-sage-200/80"
              }`}
            >
              {subTab}
            </button>
          );
        })}
      </div>

      {aiCoachSubTab === "Call prep" && (
        <div className="bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6 animate-fadeIn">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-display font-bold text-sage-900">
              Call prep: GigPay HR
            </h2>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#9C5B34] uppercase tracking-wider">
              LIKELY OBJECTIONS
            </h3>

            <div className="space-y-3 text-sm text-sage-700">
              <p>
                <strong className="text-sage-900">Our riders will not trust an app with money.</strong> — Lead with your agent network and insured custody.
              </p>
              <p>
                <strong className="text-sage-900">We have no budget for another tool.</strong> — Frame it as free for them; you monetize the saver.
              </p>
              <p>
                <strong className="text-sage-900">Can we start small?</strong> — Yes, propose a 50-rider, 30-day pilot.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-sage-100">
            <h3 className="text-xs font-bold text-[#1e4836] uppercase tracking-wider">
              YOUR GOAL FOR THE CALL
            </h3>
            <p className="text-sm text-sage-700 font-medium">
              Secure a paid 30-day pilot with 50 of their riders.
            </p>
          </div>
          
          <div className="space-y-2 pt-2 border-t border-sage-100">
            <h3 className="text-xs font-bold text-[#1e4836] uppercase tracking-wider">
              3 DISCOVERY QUESTIONS
            </h3>
            <ul className="text-sm text-sage-700 font-medium list-disc pl-4 space-y-1">
              <li>How are you currently handling driver payouts?</li>
              <li>What happens when a driver needs an emergency advance?</li>
              <li>How much time does your team spend reconciling daily trips?</li>
            </ul>
          </div>
        </div>
      )}

      {aiCoachSubTab === "Role-play" && (
        <>
          {rolePlayState === "setup" && (
            <div className="bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="text-xl font-display font-bold text-sage-900">Set up a role-play</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider block">
                    Buyer persona
                  </label>
                  <div 
                    onClick={() => {
                      setIsPersonaOpen(!isPersonaOpen);
                      setIsDifficultyOpen(false);
                    }}
                    className="bg-white border border-sage-300 rounded-card px-4 py-2.5 text-sm font-medium flex items-center justify-between cursor-pointer hover:border-sage-400 transition-colors shadow-card"
                  >
                    <span>{selectedPersona}</span>
                    <span className="text-sage-400 text-xs">▼</span>
                  </div>

                  {isPersonaOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sage-200 rounded-card shadow-raised z-20 overflow-hidden">
                      {["Skeptical HR lead", "Budget-conscious co-op", "Enthusiastic early adopter"].map((persona) => (
                        <div
                          key={persona}
                          onClick={() => {
                            setSelectedPersona(persona);
                            setIsPersonaOpen(false);
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                            selectedPersona === persona ? "bg-sage-600 text-white font-semibold" : "hover:bg-sage-100 text-sage-800"
                          }`}
                        >
                          {persona}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider block">
                    Difficulty
                  </label>
                  <div 
                    onClick={() => {
                      setIsDifficultyOpen(!isDifficultyOpen);
                      setIsPersonaOpen(false);
                    }}
                    className="bg-white border border-sage-300 rounded-card px-4 py-2.5 text-sm font-medium flex items-center justify-between cursor-pointer hover:border-sage-400 transition-colors shadow-card"
                  >
                    <span>{selectedDifficulty}</span>
                    <span className="text-sage-400 text-xs">▼</span>
                  </div>

                  {isDifficultyOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sage-200 rounded-card shadow-raised z-20 overflow-hidden">
                      {["Friendly", "Realistic", "Tough"].map((diff) => (
                        <div
                          key={diff}
                          onClick={() => {
                            setSelectedDifficulty(diff);
                            setIsDifficultyOpen(false);
                          }}
                          className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                            selectedDifficulty === diff ? "bg-sage-600 text-white font-semibold" : "hover:bg-sage-100 text-sage-800"
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
                className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-colors cursor-pointer shadow-card"
              >
                Start role-play
              </button>
            </div>
          )}

          {rolePlayState === "chat" && (
            <div className="bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-sage-100 pb-4">
                <div>
                  <h2 className="text-xl font-display font-bold text-sage-900">Role-play in progress</h2>
                  <p className="text-xs text-sage-500 mt-1">Talking to: {selectedPersona} ({selectedDifficulty})</p>
                </div>
                <button
                  onClick={() => setRolePlayState("scorecard")}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-card text-sm border border-red-200 transition-colors shadow-card"
                >
                  End session
                </button>
              </div>

              <div className="space-y-4 h-[300px] overflow-y-auto pr-2 no-scrollbar">
                {chatMessages.map((msg, idx) => {
                  const isUser = idx % 2 !== 0;
                  return (
                    <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-5 py-3.5 rounded-modal max-w-xl text-sm font-medium shadow-card ${
                        isUser 
                          ? 'bg-[#1e4836] text-white rounded-br-sm' 
                          : 'bg-[#f0f4f1] text-sage-800 border border-green-900/10 rounded-bl-sm'
                      }`}>
                        {msg}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-sage-100">
                <input
                  type="text"
                  value={userInputValue}
                  onChange={(e) => setUserInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                  placeholder="Your response to the buyer..."
                  className="flex-1 bg-sage-50 border border-sage-200 rounded-card px-4 py-3 text-sm focus:outline-none focus:border-sage-400 shadow-card"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-[#1e4836] hover:bg-[#153426] text-white font-semibold px-6 py-3 rounded-card text-sm transition-colors shadow-card"
                >
                  Send
                </button>
              </div>
            </div>
          )}
          
          {rolePlayState === "scorecard" && (
            <div className="bg-white rounded-modal border border-sage-200/90 p-6 md:p-8 shadow-card space-y-6 animate-fadeIn">
              <div className="text-center space-y-2 pb-4 border-b border-sage-100">
                <span className="text-4xl">📊</span>
                <h2 className="text-2xl font-display font-bold text-sage-900">Session Scorecard</h2>
                <p className="text-sm text-sage-500">Here is how you did with the {selectedPersona}.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-sage-50 rounded-card p-4 border border-sage-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sage-600 uppercase tracking-wider">Discovery</span>
                    <span className="text-lg font-bold text-sage-900">7/10</span>
                  </div>
                  <p className="text-xs text-sage-600">You asked great questions, but missed digging into their timeline.</p>
                </div>
                <div className="bg-sage-50 rounded-card p-4 border border-sage-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sage-600 uppercase tracking-wider">Objections</span>
                    <span className="text-lg font-bold text-sage-900">9/10</span>
                  </div>
                  <p className="text-xs text-sage-600">Excellent handling of the trust objection. Great pivot to the insured custody feature.</p>
                </div>
                <div className="bg-sage-50 rounded-card p-4 border border-sage-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sage-600 uppercase tracking-wider">Next Step</span>
                    <span className="text-lg font-bold text-red-600">4/10</span>
                  </div>
                  <p className="text-xs text-sage-600">You ended the call without securing a follow-up date or pilot commitment.</p>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setRolePlayState("setup")}
                  className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-6 py-3 rounded-card text-sm transition-colors shadow-card"
                >
                  Practice this again
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
