"use client";

import React from "react";
import { useLegalApi } from "@/hooks/useLegalApi";
import { ChevronDown, Check, FileText } from "lucide-react";

export default function FormationPage() {
  const { jurisdiction, updateJurisdiction, formationSteps, toggleFormationStep } = useLegalApi();

  const allCompleted = formationSteps.length > 0 && formationSteps.every(step => step.completed);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Get the foundation right</h1>
        <p className="text-sm text-sage-600">A jurisdiction-specific path to a properly formed company.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-sage-500">
          Where are you incorporating?
        </label>
        <div className="relative">
          <select
            value={jurisdiction}
            onChange={(e) => updateJurisdiction(e.target.value)}
            className="w-full bg-white border border-sage-300 rounded-card px-4 py-3 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-[#0e271f]/20 appearance-none cursor-pointer"
          >
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="Ghana">Ghana</option>
            <option value="Delaware, USA">Delaware, USA</option>
          </select>
          <ChevronDown className="w-4 h-4 text-sage-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-modal border border-sage-200/90 shadow-card divide-y divide-sage-100 overflow-hidden">
        {formationSteps.map((step) => (
          <div
            key={step.id}
            onClick={() => toggleFormationStep(step.id)}
            className="p-5 flex items-center justify-between gap-4 hover:bg-sage-50/60 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-6 h-6 rounded-input flex items-center justify-center transition-colors border ${
                  step.completed
                    ? "bg-[#1e4836] border-[#1e4836] text-white"
                    : "bg-white border-sage-300 text-transparent"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <h4 className={`font-semibold text-sm ${step.completed ? "line-through text-sage-400" : "text-sage-900"}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-sage-500 mt-0.5">{step.meta}</p>
              </div>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="text-xs font-medium text-sage-600 hover:text-sage-900 bg-sage-100/80 hover:bg-sage-200 px-3 py-1.5 rounded-input transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Docs</span>
            </button>
          </div>
        ))}
      </div>

      {allCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-modal p-6 text-center animate-fadeIn shadow-card">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-3">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <h2 className="text-xl font-bold text-green-900 mb-1">Entity Fully Formed</h2>
          <p className="text-sm text-green-700 font-medium">
            Your {jurisdiction} company is ready for business. All required documents have been secured.
          </p>
        </div>
      )}
    </div>
  );
}
