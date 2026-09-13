'use client';

import React, { useState } from 'react';
import { useValidationApi } from '@/hooks/useValidationApi';
import { useToast } from '../layout';
import { InsightSynthesizer } from '../components/InsightSynthesizer';

interface InterviewNoteItem {
  id: string;
  interviewee: string;
  segmentTag: string;
  quote: string;
  stance: "Supports" | "Contradicts" | "Neutral";
}

export default function InterviewsPage() {
  const { interviews } = useValidationApi();
  const { triggerToast } = useToast();

  const [intervieweeInput, setIntervieweeInput] = useState("");
  const [segmentTagInput, setSegmentTagInput] = useState("");
  const [quoteInput, setQuoteInput] = useState("");
  const [selectedStance, setSelectedStance] = useState<"Supports" | "Contradicts" | "Neutral">("Supports");

  // Populate from API data, mapped to local interface
  const [interviewsList, setInterviewsList] = useState<InterviewNoteItem[]>(
    interviews.map(i => ({
      id: i.id,
      interviewee: i.interviewee,
      segmentTag: i.segment,
      quote: i.keyQuotes?.[0] || "",
      stance: i.verdict === 'Supports' ? 'Supports' : i.verdict === 'Contradicts' ? 'Contradicts' : 'Neutral'
    }))
  );

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
    triggerToast("Interview note saved.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-display font-semibold text-sage-900 tracking-tight">
          Interview notes
        </h1>
        <InsightSynthesizer />
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
              className="w-full bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-3 rounded-card text-sm transition-all cursor-pointer shadow-card mt-2"
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
  );
}
