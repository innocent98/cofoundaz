"use client";

import React, { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentRunner } from "@/hooks/useAssessmentApi";
import {
  DIMENSION_LABEL,
  DIMENSION_ORDER,
  sectionProgress,
  type AssessmentQuestion,
  type AnswerValue,
} from "@/lib/api/assessment";
import { useToast } from "../../ToastContext";

const OPTION_BASE =
  "bg-white rounded-modal p-5 border transition-all cursor-pointer shadow-card font-medium text-sm md:text-base";
const OPTION_ON = "border-[#1e4836] bg-[#f0f5f2] text-[#0e271f]";
const OPTION_OFF = "border-sage-200 hover:border-sage-300 text-sage-800";
const PRIMARY_BTN =
  "bg-[#1e4836] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#153427] text-white font-bold text-sm px-6 py-3 rounded-[8px] transition-colors";

/** One input per qtype. Keyed by question.key by the parent so its local state resets per question. */
function QuestionInput({
  question,
  disabled,
  onSubmit,
}: {
  question: AssessmentQuestion;
  disabled: boolean;
  onSubmit: (value: AnswerValue) => void;
}) {
  const [picked, setPicked] = useState<string | number | null>(null);
  const [multi, setMulti] = useState<string[]>([]);
  const [text, setText] = useState("");

  const pick = (value: string | number) => {
    if (disabled) return;
    setPicked(value);
    onSubmit(value);
  };

  if (question.qtype === "single_choice") {
    return (
      <div className="space-y-3">
        {(question.options ?? []).map((opt) => (
          <button
            type="button"
            key={opt.value}
            disabled={disabled}
            onClick={() => pick(opt.value)}
            className={`w-full text-left ${OPTION_BASE} ${picked === opt.value ? OPTION_ON : OPTION_OFF}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (question.qtype === "scale_1_5") {
    return (
      <div className="grid grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            type="button"
            key={num}
            disabled={disabled}
            onClick={() => pick(num)}
            aria-label={`${num} out of 5`}
            className={`bg-white rounded-modal p-6 text-center border transition-all cursor-pointer shadow-card font-display font-bold text-xl md:text-2xl ${
              picked === num ? OPTION_ON : OPTION_OFF
            }`}
          >
            {num}
          </button>
        ))}
      </div>
    );
  }

  if (question.qtype === "multi_choice") {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {(question.options ?? []).map((opt) => {
            const isSelected = multi.includes(opt.value);
            return (
              <button
                type="button"
                key={opt.value}
                disabled={disabled}
                onClick={() =>
                  setMulti((prev) =>
                    prev.includes(opt.value) ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]
                  )
                }
                className={`w-full text-left flex items-center gap-3 ${OPTION_BASE} ${isSelected ? OPTION_ON : OPTION_OFF}`}
              >
                <span
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    isSelected ? "bg-[#1e4836] border-[#1e4836]" : "border-sage-300 bg-white"
                  }`}
                >
                  {isSelected && <span className="text-white text-xs">✓</span>}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => onSubmit(multi)} disabled={disabled || multi.length === 0} className={PRIMARY_BTN}>
          Next question →
        </button>
      </div>
    );
  }

  if (question.qtype === "numeric_currency") {
    const parsed = text.trim() === "" ? NaN : Number(text);
    const valid = Number.isFinite(parsed) && parsed >= 0;
    return (
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !disabled) onSubmit(parsed);
        }}
      >
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-500 font-semibold text-lg">₦</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={question.prompt}
            className="w-full bg-white border border-sage-300 rounded-modal p-4 pl-10 shadow-card text-lg outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400"
            placeholder="0"
          />
        </div>
        <button type="submit" disabled={disabled || !valid} className={PRIMARY_BTN}>
          Next question →
        </button>
      </form>
    );
  }

  // short_text
  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={question.prompt}
        className="w-full h-32 bg-white border border-sage-300 rounded-modal p-4 shadow-card text-base outline-none focus:border-sage-400 focus:ring-1 focus:ring-sage-400 resize-none"
        placeholder="Type your answer here..."
      />
      <button type="button" onClick={() => onSubmit(text.trim())} disabled={disabled || text.trim() === ""} className={PRIMARY_BTN}>
        Next question →
      </button>
    </div>
  );
}

export default function AssessmentRunnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { triggerToast } = useToast();
  const { phase, question, result, submitting, answerError, loadError, answer, retry } = useAssessmentRunner(id);

  const handleSaveAndExit = () => {
    // Every answer is saved server-side as it is submitted, so there is nothing to flush.
    triggerToast("Assessment progress saved. You can resume anytime.");
    router.push("/assessment/in-progress");
  };

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4" role="status">
        <div className="w-10 h-10 rounded-full border-4 border-sage-200 border-t-[#9C5B34] animate-spin" />
        <p className="text-sage-500 text-sm">Loading your assessment...</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 max-w-md mx-auto" role="alert">
        <h2 className="text-xl font-display font-semibold text-sage-900">We couldn&apos;t load this assessment</h2>
        <p className="text-sage-500 text-sm">{loadError}</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => void retry()} className={PRIMARY_BTN}>
            Try again
          </button>
          <button
            type="button"
            onClick={() => router.push("/assessment")}
            className="bg-white border border-sage-200 text-sage-800 font-bold text-sm px-6 py-3 rounded-[8px] hover:border-sage-300 transition-colors"
          >
            Back to overview
          </button>
        </div>
      </div>
    );
  }

  if (phase === "completing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fadeIn" role="status">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-sage-200 border-t-[#9C5B34] animate-spin"></div>
        </div>
        <h2 className="text-2xl font-display font-semibold text-sage-900 tracking-tight animate-pulse">
          Done. Recalibrating your workspace...
        </h2>
      </div>
    );
  }

  if (phase === "done" && result) {
    return (
      <div className="flex flex-col items-center min-h-[60vh] text-center space-y-6 animate-fadeIn max-w-lg mx-auto">
        <div
          className="w-16 h-16 rounded-full bg-[#1e4836] text-white flex items-center justify-center font-bold text-2xl mb-2"
          aria-label={`Overall score ${result.overall_provisional}`}
        >
          {result.overall_provisional}
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-semibold text-sage-900">
            Your assessment score is {result.overall_provisional}.
          </h1>
          {result.narrative && <p className="text-sage-500">{result.narrative}</p>}
        </div>
        <div className="w-full space-y-3 pt-2">
          {DIMENSION_ORDER.map((dim) => (
            <div
              key={dim}
              className="bg-white rounded-modal p-4 border border-sage-200/80 shadow-card flex items-center justify-between font-medium"
            >
              <span className="text-sage-800">{DIMENSION_LABEL[dim]}</span>
              <span className="text-[#1e4836] font-semibold">{result.dimension_scores[dim]}/100</span>
            </div>
          ))}
        </div>
        <div className="w-full space-y-3 mt-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-8 py-3 rounded-card transition-colors w-full shadow-card"
          >
            See my dashboard
          </button>
          <button
            type="button"
            onClick={() => router.push("/assessment/results")}
            className="bg-white border border-sage-200 text-sage-800 font-semibold px-8 py-3 rounded-card hover:border-sage-300 transition-colors w-full"
          >
            View past results
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const progress = sectionProgress(question.dimension);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn pt-4">
      {/* SECTION HEADER & PROGRESS BAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-sage-500">
          <span className="uppercase tracking-wider">
            Section {progress.sectionNumber} of {progress.totalSections}: {question.section}
          </span>
          <button
            type="button"
            onClick={handleSaveAndExit}
            className="text-sage-700 hover:text-sage-900 cursor-pointer border border-sage-200 px-3 py-1.5 rounded bg-white shadow-card"
          >
            Save & exit
          </button>
        </div>

        <div className="w-full bg-[#d2e2d8]/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#1e4836] h-full rounded-full transition-all duration-300"
            style={{ width: `${progress.pct}%` }}
          ></div>
        </div>

        <p className="text-xs text-sage-400 italic">Adaptive: I skip anything that doesn&apos;t apply to you.</p>
      </div>

      {/* QUESTION CARD */}
      <div className="space-y-6 pt-4">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
            {question.prompt}
          </h2>
          {question.helper && <p className="text-sm text-sage-500">{question.helper}</p>}
        </div>

        <QuestionInput key={question.key} question={question} disabled={submitting} onSubmit={(v) => void answer(v)} />

        {answerError && (
          <p role="alert" className="text-sm text-[#B0483B]">
            {answerError}
          </p>
        )}
      </div>
    </div>
  );
}
