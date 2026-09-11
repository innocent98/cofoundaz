"use client";

import React, { useState } from "react";
import { useToast } from "../ToastContext";
import { Save, AlertTriangle } from "lucide-react";

export default function NarrativePage() {
  const { triggerToast } = useToast();
  const [draft, setDraft] = useState(
    "Our current MRR is ₦1.6M, driven entirely by organic word-of-mouth. With this ₦90M injection, we will formalize our outbound sales motion and reduce our CAC payback period to 6 months, scaling to ₦10M MRR within 18 months."
  );

  const discrepancies = [
    {
      id: 1,
      issue: "Deck says ₦2M MRR; your model says ₦1.6M.",
      advice: "Fix the number or the story. Investors will catch this discrepancy during diligence."
    },
    {
      id: 2,
      issue: "Use of funds mentions 3 engineering hires, but your headcount model only accounts for 2.",
      advice: "Align your hiring plan with your financial forecast."
    }
  ];

  const handleSave = () => {
    triggerToast("Financial narrative saved.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12 max-w-5xl mx-auto pt-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Narrative consistency</h1>
        <p className="text-sm text-sage-500">Ensure your deck, your model, and your script tell the exact same story.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white rounded-modal border border-sage-200 shadow-card p-6 flex flex-col h-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-sage-900">The Financial Story Draft</h3>
            <button
              onClick={handleSave}
              className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-1.5 px-3 rounded-card text-xs transition-colors shadow-card flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save draft</span>
            </button>
          </div>
          
          <div className="flex-1 min-h-[300px]">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Draft your financial narrative here..."
              className="w-full h-full min-h-[300px] resize-y bg-sage-50 border border-sage-200 rounded-card p-4 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] transition-colors leading-relaxed"
            />
          </div>
          <p className="text-xs text-sage-500 italic">
            This block will be analyzed by the consistency checker against your uploaded pitch deck and financial model.
          </p>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-semibold text-sm text-sage-900 px-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#8A5330]" />
            AI Discrepancies
          </h3>

          {discrepancies.map((d) => (
            <div key={d.id} className="bg-white rounded-modal border border-[#EAD5C6] shadow-card p-4 space-y-2">
              <p className="text-sm font-semibold text-sage-900 leading-snug">{d.issue}</p>
              <div className="bg-[#f5efe6] p-3 rounded-card text-xs text-[#8A5330] font-medium border border-[#EAD5C6]">
                {d.advice}
              </div>
            </div>
          ))}

          {discrepancies.length === 0 && (
            <div className="bg-sage-50 rounded-modal border border-sage-200/50 p-6 text-center text-sage-500 text-sm">
              Your narrative is perfectly aligned.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
