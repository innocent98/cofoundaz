"use client";

import React, { useState } from "react";
import { useFundingApi, InvestorStage, InvestorDeal } from "@/hooks/useFundingApi";
import { useToast } from "./ToastContext";
import { X } from "lucide-react";

export default function PipelinePage() {
  const { pipeline, updatePipelineStage } = useFundingApi();
  const { triggerToast } = useToast();

  const stages: { id: InvestorStage; title: string }[] = [
    { id: "Research", title: "Research" },
    { id: "Outreach", title: "Outreach" },
    { id: "Meeting", title: "Meeting" },
    { id: "Diligence", title: "Diligence" },
    { id: "Term Sheet", title: "Term Sheet" },
    { id: "Committed", title: "Committed" },
    { id: "Passed", title: "Passed" },
  ];

  const [selectedInvestor, setSelectedInvestor] = useState<InvestorDeal | null>(null);
  const [passedModalInvestor, setPassedModalInvestor] = useState<InvestorDeal | null>(null);

  const handleCardClick = (investor: InvestorDeal) => {
    setSelectedInvestor(investor);
  };

  const handleDragStart = (e: React.DragEvent, investorId: string) => {
    e.dataTransfer.setData("investorId", investorId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: InvestorStage) => {
    e.preventDefault();
    const investorId = e.dataTransfer.getData("investorId");
    
    if (targetStage === "Passed") {
      const inv = pipeline.find(i => i.id === investorId);
      if (inv) setPassedModalInvestor(inv);
      return;
    }

    updatePipelineStage(investorId, targetStage);
    triggerToast(`Moved to ${targetStage}`);
  };

  const handlePassedReasonSelect = (reason: string) => {
    if (passedModalInvestor) {
      updatePipelineStage(passedModalInvestor.id, "Passed");
      triggerToast(`Marked as Passed: ${reason}`);
    }
    setPassedModalInvestor(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-white rounded-modal border border-sage-200/90 p-5 shadow-card max-w-lg space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-sage-600">
          <span>Soft-committed vs target round</span>
          <span className="text-sage-900 font-bold">₦58M of ₦90M</span>
        </div>
        <div className="w-full bg-sage-100 h-3 rounded-full overflow-hidden">
          <div className="bg-[#1e4836] h-full rounded-full w-[64%]"></div>
        </div>
      </div>

      <div className="flex gap-4 items-start overflow-x-auto pb-4 scrollbar-none">
        {stages.map((stage) => {
          const investorsInStage = pipeline.filter(inv => inv.stage === stage.id);
          
          return (
            <div 
              key={stage.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="bg-[#f0f3f0] rounded-modal p-3 border border-sage-200/60 space-y-3 min-w-[280px] max-w-[280px]"
            >
              <div className="px-1 pt-1 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-sage-900">{stage.title}</h3>
                <span className="bg-sage-200/70 text-sage-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {investorsInStage.length}
                </span>
              </div>

              <div className="space-y-3">
                {investorsInStage.map((inv) => (
                  <div
                    key={inv.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, inv.id)}
                    onClick={() => handleCardClick(inv)}
                    className="bg-white rounded-card border border-sage-200/80 p-4 shadow-card hover:border-[#9C5B34] transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-sage-900 group-hover:text-[#8A5330] transition-colors">
                        {inv.name} <span className="text-sage-500 font-normal">({inv.firm})</span>
                      </h4>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        inv.isWarm
                          ? "bg-[#e2ede6] text-[#1e4836] border-[#d2e2d8]"
                          : "bg-sage-100 text-sage-600 border-sage-200"
                      }`}>
                        {inv.isWarm ? "Warm" : "Cold"}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-sage-900">{inv.checkRange}</p>
                      <p className="text-xs text-sage-500 mt-1">{inv.nextStep}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-sage-500 italic pt-2">
        Tip: Drag and drop cards to update pipeline stages. Click an investor card to get a meeting-prep brief from the Fundraising Copilot.
      </p>

      {/* Slide-over Drawer for Investor Profile */}
      {selectedInvestor && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60] animate-fadeIn"
            onClick={() => setSelectedInvestor(null)}
          ></div>
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[70] border-l border-sage-200 flex flex-col animate-[slideInRight_0.3s_ease-out]">
            <div className="flex items-center justify-between p-6 border-b border-sage-100">
              <h2 className="text-xl font-display font-bold text-sage-900">{selectedInvestor.name}</h2>
              <button 
                onClick={() => setSelectedInvestor(null)}
                className="p-2 rounded-full hover:bg-sage-100 text-sage-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-1">
                <p className="text-sm text-sage-500">Firm</p>
                <p className="font-semibold text-sage-900">{selectedInvestor.firm}</p>
              </div>

              {selectedInvestor.thesisNotes && (
                <div className="space-y-1">
                  <p className="text-sm text-sage-500">Fund Thesis & Profile Notes</p>
                  <p className="text-sm text-sage-900">{selectedInvestor.thesisNotes}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-sage-500">Last Touch</p>
                <p className="font-semibold text-sage-900">{selectedInvestor.lastTouch}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-sage-500">Data Room Status</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5efe6] border border-[#e8d5c4] text-[#8A5330] text-xs font-bold">
                  Shared - Viewed Pitch Deck
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => triggerToast(`Generating meeting brief for ${selectedInvestor.name}...`)}
                  className="w-full bg-[#1e3b30] hover:bg-[#152a22] text-white font-semibold py-3 px-4 rounded-card transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <span className="text-lg leading-none">✨</span>
                  <span>Prep me for this meeting</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Passed Reason Modal */}
      {passedModalInvestor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 animate-fadeIn">
          <div className="bg-white rounded-modal p-6 w-full max-w-sm shadow-xl space-y-6">
            <h2 className="text-lg font-display font-bold text-sage-900">Why did they pass?</h2>
            <div className="space-y-2">
              {['Valuation', 'Stage mismatch', 'Sector conflict', 'Ghosted', 'Other'].map(reason => (
                <button
                  key={reason}
                  onClick={() => handlePassedReasonSelect(reason)}
                  className="w-full text-left px-4 py-3 bg-sage-50 hover:bg-sage-100 text-sage-900 text-sm font-medium rounded-card border border-sage-200 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPassedModalInvestor(null)}
              className="w-full px-4 py-3 bg-white border border-sage-300 hover:bg-sage-50 text-sage-700 text-sm font-semibold rounded-card transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
