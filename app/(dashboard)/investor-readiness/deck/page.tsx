"use client";

import React, { useState } from "react";
import { useReadinessApi } from "@/hooks/useReadinessApi";
import { useToast } from "../ToastContext";
import { UploadCloud, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export default function PitchDeckReviewPage() {
  const { deckReview } = useReadinessApi();
  const { triggerToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    triggerToast("Reading your deck like a partner on a Monday morning…");
    setTimeout(() => {
      setIsUploading(false);
      triggerToast("Review complete.");
    }, 2500);
  };

  if (!deckReview) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20 animate-fadeIn">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-display font-semibold text-neutral-900">Upload your pitch deck</h2>
        <p className="text-neutral-500 text-sm max-w-sm text-center">
          Drop your PDF here to get an instant AI review on narrative flow, design, and data clarity.
        </p>
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-4 bg-brand-hover hover:bg-brand-x153427 text-white font-semibold py-3 px-6 rounded-card transition-colors shadow-card"
        >
          {isUploading ? "Reviewing..." : "Select PDF File"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-neutral-900 mb-1">Pitch deck review</h1>
          <p className="text-sm text-neutral-500">Version {deckReview.version} · Reviewed just now</p>
        </div>
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 font-semibold py-2 px-4 rounded-card text-sm transition-colors shadow-card"
        >
          {isUploading ? "Reviewing..." : "Re-review new version"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-5 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Narrative</span>
          <div className="text-4xl font-display font-bold text-brand-hover">{deckReview.narrativeScore}<span className="text-neutral-300 text-2xl">/10</span></div>
        </div>
        <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-5 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Design</span>
          <div className="text-4xl font-display font-bold text-brand-hover">{deckReview.designScore}<span className="text-neutral-300 text-2xl">/10</span></div>
        </div>
        <div className="bg-white rounded-modal border border-neutral-200 shadow-card p-5 flex flex-col items-center justify-center text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Data Clarity</span>
          <div className="text-4xl font-display font-bold text-accent-700">{deckReview.dataScore}<span className="text-neutral-300 text-2xl">/10</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white rounded-modal border border-neutral-200 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-accent-700" />
            Top fixes
          </h3>
          <ul className="space-y-3">
            {deckReview.topFixes.map((fix, idx) => (
              <li key={idx} className="text-sm text-neutral-700 flex items-start gap-2">
                <span className="text-neutral-300 font-bold mt-0.5">{idx + 1}.</span>
                <span>{fix}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-8 bg-white rounded-modal border border-neutral-200 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-neutral-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-hover" />
            Slide-by-slide breakdown
          </h3>
          <div className="space-y-4 divide-y divide-neutral-100">
            {deckReview.slideNotes.map((note) => (
              <div key={note.slide} className="pt-4 first:pt-0 flex items-start gap-4">
                <div className="w-20 h-14 bg-neutral-100 border border-neutral-200 rounded shrink-0 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-neutral-300" />
                  <span className="absolute text-[10px] font-bold text-neutral-500">{note.slide}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm text-neutral-900">Slide {note.slide}: {note.title}</h4>
                  <p className="text-sm text-neutral-600">{note.feedback}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
