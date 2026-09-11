"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAssessmentApi } from "@/hooks/useAssessmentApi";
import { useToast } from "../../ToastContext";

export default function AssessmentRunnerPage() {
  const router = useRouter();
  const { id } = useParams();
  const { triggerToast } = useToast();
  const { activeSession, questions, saveAnswer, completeAssessment } = useAssessmentApi();

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedScore, setCompletedScore] = useState<number | null>(null);

  // Fallback if no session
  useEffect(() => {
    if (!activeSession && !isProcessing && completedScore === null) {
      router.replace('/assessment');
    }
  }, [activeSession, isProcessing, completedScore, router]);

  if (!activeSession && !isProcessing && completedScore === null) {
    return null; // or a loading spinner
  }

  const handleSaveAndExit = () => {
    triggerToast("Assessment progress saved. You can resume anytime.");
    router.push('/assessment/in-progress');
  };

  const currentQ = questions[activeSession?.currentQuestionIndex || 0];
  const isLastQuestion = activeSession && activeSession.currentQuestionIndex === questions.length - 1;

  const handleAdvance = async () => {
    if (isLastQuestion) {
      setIsProcessing(true);
      const score = await completeAssessment();
      setIsProcessing(false);
      setCompletedScore(score || 0);
    }
  };

  const handleOptionSelect = (val: string | number) => {
    if (!currentQ) return;
    saveAnswer(currentQ.id, val);
    setTimeout(handleAdvance, 300); // Auto-advance for single click
  };

  const handleMultiSelect = (val: string) => {
    if (!currentQ || !activeSession) return;
    const currentList: string[] = activeSession.answers[currentQ.id] || [];
    const isSelected = currentList.includes(val);
    const newList = isSelected ? currentList.filter(item => item !== val) : [...currentList, val];
    saveAnswer(currentQ.id, newList);
  };

  const handleTextInput = (val: string) => {
    if (!currentQ) return;
    saveAnswer(currentQ.id, val);
  };

  if (completedScore !== null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fadeIn max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-[#1e4836] text-white flex items-center justify-center font-bold text-2xl mb-2">
          {completedScore}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-semibold text-sage-900">
            Your Health Score is now {completedScore}.
          </h1>
          <p className="text-sage-500">Here's what changed.</p>
        </div>
        <div className="w-full space-y-3 pt-2">
          <div className="bg-white rounded-modal p-4 border border-sage-200/80 shadow-card flex items-center justify-between font-medium">
            <span className="text-sage-800">Product</span>
            <span className="text-[#1e4836] font-semibold">↑ 85</span>
          </div>
          <div className="bg-white rounded-modal p-4 border border-sage-200/80 shadow-card flex items-center justify-between font-medium">
            <span className="text-sage-800">Market</span>
            <span className="text-[#1e4836] font-semibold">↑ 80</span>
          </div>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-8 py-3 rounded-card transition-colors w-full shadow-card mt-4"
        >
          See my dashboard
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fadeIn">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-sage-200 border-t-[#9C5B34] animate-spin"></div>
          <span className="absolute text-xl">✨</span>
        </div>
        <h2 className="text-2xl font-display font-semibold text-sage-900 tracking-tight animate-pulse">
          Done. Recalibrating your workspace...
        </h2>
      </div>
    );
  }

  if (!currentQ || !activeSession) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pt-4">
      {/* SECTION HEADER & PROGRESS BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-sage-500">
          <span className="uppercase tracking-wider">Section {currentQ.sectionNumber}: {currentQ.sectionName}</span>
          <button
            onClick={handleSaveAndExit}
            className="text-sage-700 hover:text-sage-900 cursor-pointer border border-sage-200 px-3 py-1.5 rounded bg-white shadow-card"
          >
            Save & exit
          </button>
        </div>

        <div className="w-full bg-[#d2e2d8]/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#1e4836] h-full rounded-full transition-all duration-300"
            style={{ width: `${activeSession.progressPct}%` }}
          ></div>
        </div>

        <p className="text-xs text-sage-400 italic">
          Adaptive: I skip anything that doesn't apply to you.
        </p>
      </div>

      {/* QUESTION CARD */}
      <div className="space-y-6 pt-4">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
          {currentQ.title}
        </h2>

        {/* SINGLE CHOICE */}
        {currentQ.type === "single_choice" && currentQ.options && (
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = activeSession.answers[currentQ.id] === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleOptionSelect(opt.value)}
                  className={`bg-white rounded-modal p-5 border transition-all cursor-pointer shadow-card font-medium text-sm md:text-base ${
                    isSelected
                      ? "border-[#1e4836] bg-[#f0f5f2] text-[#0e271f]"
                      : "border-sage-200 hover:border-sage-300 text-sage-800"
                  }`}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
        )}

        {/* SCALE */}
        {currentQ.type === "scale" && (
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = activeSession.answers[currentQ.id] === num;
                return (
                  <div
                    key={num}
                    onClick={() => handleOptionSelect(num)}
                    className={`bg-white rounded-modal p-6 text-center border transition-all cursor-pointer shadow-card font-display font-bold text-xl md:text-2xl ${
                      isSelected
                        ? "border-[#1e4836] bg-[#f0f5f2] text-[#0e271f]"
                        : "border-sage-200 hover:border-sage-300 text-sage-800"
                    }`}
                  >
                    {num}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-sage-400 px-1">
              <span>Not at all</span>
              <span>Completely</span>
            </div>
          </div>
        )}

        {/* MULTI CHOICE */}
        {currentQ.type === "multi_choice" && currentQ.options && (
          <div className="space-y-4">
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const currentSelected: string[] = activeSession.answers[currentQ.id] || [];
                const isSelected = currentSelected.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleMultiSelect(opt.value)}
                    className={`bg-white rounded-modal p-5 border transition-all cursor-pointer shadow-card font-medium text-sm md:text-base flex items-center gap-3 ${
                      isSelected
                        ? "border-[#1e4836] bg-[#f0f5f2] text-[#0e271f]"
                        : "border-sage-200 hover:border-sage-300 text-sage-800"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[#1e4836] border-[#1e4836]' : 'border-sage-300 bg-white'}`}>
                      {isSelected && <span className="text-white text-xs">✓</span>}
                    </div>
                    {opt.label}
                  </div>
                );
              })}
            </div>
            <button 
              onClick={handleAdvance}
              className="bg-[#1e4836] hover:bg-[#153427] text-white font-bold text-sm px-6 py-3 rounded-[8px] transition-colors"
            >
              Next question →
            </button>
          </div>
        )}

        {/* NUMERIC */}
        {currentQ.type === "numeric" && (
          <div className="space-y-4">
            <div className="relative">
              {currentQ.currencyPrefix && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-500 font-semibold text-lg">
                  {currentQ.currencyPrefix}
                </span>
              )}
              <input 
                type="number" 
                value={activeSession.answers[currentQ.id] || ''}
                onChange={(e) => handleTextInput(e.target.value)}
                className={`w-full bg-white border border-sage-300 rounded-modal p-4 shadow-card text-lg outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 ${currentQ.currencyPrefix ? 'pl-10' : ''}`}
                placeholder="0"
              />
            </div>
            <button 
              onClick={handleAdvance}
              disabled={!activeSession.answers[currentQ.id]}
              className="bg-[#1e4836] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#153427] text-white font-bold text-sm px-6 py-3 rounded-[8px] transition-colors"
            >
              Next question →
            </button>
          </div>
        )}

        {/* SHORT TEXT */}
        {currentQ.type === "short_text" && (
          <div className="space-y-4">
            <textarea 
              value={activeSession.answers[currentQ.id] || ''}
              onChange={(e) => handleTextInput(e.target.value)}
              className="w-full h-32 bg-white border border-sage-300 rounded-modal p-4 shadow-card text-base outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 resize-none"
              placeholder="Type your answer here..."
            />
            <button 
              onClick={handleAdvance}
              className="bg-[#1e4836] hover:bg-[#153427] text-white font-bold text-sm px-6 py-3 rounded-[8px] transition-colors"
            >
              {isLastQuestion ? "Complete assessment" : "Next question →"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
