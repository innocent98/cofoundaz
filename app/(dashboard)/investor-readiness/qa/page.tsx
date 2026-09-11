"use client";

import React, { useState } from "react";
import { QAIntensity } from "@/hooks/useReadinessApi";
import { useToast } from "../ToastContext";
import { MessageSquare, Send, CheckCircle2, AlertCircle } from "lucide-react";

type SessionState = 'setup' | 'active' | 'review';

export default function MockQAPage() {
  const { triggerToast } = useToast();
  
  const [sessionState, setSessionState] = useState<SessionState>('setup');
  const [focus, setFocus] = useState("General");
  const [intensity, setIntensity] = useState<QAIntensity>("Friendly angel");

  const [chatMessages, setChatMessages] = useState<{ role: 'ai' | 'user'; content: string }[]>([]);
  const [currentInput, setCurrentInput] = useState("");

  const startSession = () => {
    setChatMessages([
      { role: 'ai', content: `Alright, let's talk about ${focus.toLowerCase()}. Walk me through it.` }
    ]);
    setSessionState('active');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', content: currentInput }]);
    setCurrentInput("");

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { role: 'ai', content: "Can you elaborate on how that translates to your 12-month revenue goals?" }
      ]);
    }, 1000);
  };

  const endSession = () => {
    setSessionState('review');
    triggerToast("Session ended. Generating scorecard...");
  };

  if (sessionState === 'setup') {
    return (
      <div className="space-y-6 animate-fadeIn pb-12 max-w-2xl mx-auto pt-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-semibold text-sage-900">Mock Q&A</h1>
          <p className="text-sm text-sage-500">Practice your pitch defense before you get in the room.</p>
        </div>

        <div className="bg-white rounded-modal border border-sage-200 shadow-card p-6 md:p-8 space-y-8">
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-sage-500">Topic focus</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['General', 'Financials', 'Market', 'Team'].map(topic => (
                <button
                  key={topic}
                  onClick={() => setFocus(topic)}
                  className={`py-3 px-4 rounded-card text-sm font-medium border transition-colors ${
                    focus === topic 
                      ? "bg-[#e2ede6] text-[#1e4836] border-[#1e4836]" 
                      : "bg-white text-sage-600 border-sage-200 hover:bg-sage-50"
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-sage-500">Investor persona</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['Friendly angel', 'Skeptical VC', 'Term-sheet grilling'] as QAIntensity[]).map(level => (
                <button
                  key={level}
                  onClick={() => setIntensity(level)}
                  className={`py-3 px-4 rounded-card text-sm font-medium border transition-colors ${
                    intensity === level 
                      ? "bg-[#f5efe6] text-[#8A5330] border-[#8A5330]" 
                      : "bg-white text-sage-600 border-sage-200 hover:bg-sage-50"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="w-full bg-[#1e4836] hover:bg-[#153427] text-white font-semibold py-3.5 px-6 rounded-card transition-colors shadow-card flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Start mock session</span>
          </button>
        </div>
      </div>
    );
  }

  if (sessionState === 'active') {
    return (
      <div className="h-[calc(100vh-160px)] flex flex-col max-w-3xl mx-auto bg-white rounded-modal border border-sage-200 shadow-card overflow-hidden animate-fadeIn">
        <div className="bg-sage-50 border-b border-sage-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sage-900">{intensity}</h2>
            <p className="text-xs text-sage-500">Focusing on {focus}</p>
          </div>
          <button
            onClick={endSession}
            className="bg-white hover:bg-sage-100 text-sage-800 border border-sage-300 font-semibold py-1.5 px-4 rounded-card text-xs transition-colors shadow-sm"
          >
            End session
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-[20px] px-5 py-3.5 ${
                msg.role === 'user' 
                  ? 'bg-[#1e4836] text-white rounded-br-sm' 
                  : 'bg-sage-100 text-sage-900 rounded-bl-sm'
              }`}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-sage-200">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="Type your answer..."
              className="w-full bg-sage-50 border border-sage-200 rounded-full pl-5 pr-12 py-3 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] transition-colors"
            />
            <button
              type="submit"
              className="absolute right-2 top-1.5 bottom-1.5 w-9 bg-[#1e4836] text-white rounded-full flex items-center justify-center hover:bg-[#153427] transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // sessionState === 'review'
  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl mx-auto pt-4">
      <div className="text-center space-y-2 pb-4">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Session scorecard</h1>
        <p className="text-sm text-[#8A5330] font-medium max-w-md mx-auto italic">
          &quot;Rough edges found here are cheap. Found in the room, they&apos;re expensive.&quot;
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-modal border border-sage-200 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-sage-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1e4836]" />
            Strongest answer
          </h3>
          <div className="bg-[#f0f3f0] p-4 rounded-card text-sm text-sage-800 italic">
            &quot;Our CAC is elevated right now, but it&apos;s a deliberate land-grab strategy. Our LTV:CAC is still 3.2.&quot;
          </div>
          <p className="text-xs text-sage-600 font-medium">You owned the narrative instead of getting defensive.</p>
        </div>

        <div className="bg-white rounded-modal border border-sage-200 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-sage-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            Weakest answer
          </h3>
          <div className="bg-red-50/50 p-4 rounded-card text-sm text-sage-800 italic border border-red-100">
            &quot;We don&apos;t really have competitors doing exactly what we do.&quot;
          </div>
          <p className="text-xs text-sage-600 font-medium">Never say this. It signals you haven&apos;t researched indirect competitors.</p>
          <div className="mt-4 border-t border-sage-100 pt-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sage-500 block mb-2">Model answer</span>
            <p className="text-sm text-sage-700">
              &quot;While legacy players like X solve the data piece, and startups like Y solve the workflow, we are the only ones combining both into a single platform.&quot;
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => setSessionState('setup')}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-3 px-8 rounded-card transition-colors shadow-card"
        >
          Run another session
        </button>
      </div>
    </div>
  );
}
