"use client";

import React from "react";
import { useFundingApi } from "@/hooks/useFundingApi";
import { useToast } from "../ToastContext";

export default function GrantsPage() {
  const { grantMatches, removeGrantMatch } = useFundingApi();
  const { triggerToast } = useToast();

  const handleStartApplication = (grantTitle: string) => {
    triggerToast(`Drafting your ${grantTitle} application with AI.`);
  };

  const handleNotRelevant = (grantId: string, grantTitle: string) => {
    removeGrantMatch(grantId);
    triggerToast(`Dismissed ${grantTitle}.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Grants</h1>
        <p className="text-sm text-sage-500">Discover and apply for non-dilutive capital.</p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-sage-500">AI MATCHES</h3>

        <div className="space-y-4">
          {grantMatches.length === 0 ? (
            <div className="bg-white rounded-modal border border-sage-200 p-8 text-center space-y-2 shadow-card">
              <p className="text-sage-900 font-semibold">I scan for grants that fit your profile.</p>
              <p className="text-sage-500 text-sm">New matches land here.</p>
            </div>
          ) : (
            grantMatches.map((grant) => (
              <div 
                key={grant.id}
                className="bg-white rounded-modal border border-sage-200/95 p-5 md:p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-5">
                  <div className="bg-[#e2ede6] text-[#1e4836] px-3.5 py-2.5 rounded-card font-display font-bold text-center shrink-0 min-w-[70px]">
                    <div className="text-base md:text-lg leading-tight">{grant.fitScore}%</div>
                    <div className="text-[10px] uppercase font-body tracking-wider opacity-80">FIT</div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-base text-sage-900">{grant.name}</h4>
                    <p className="text-xs text-sage-500 font-medium">
                      {grant.funder} · {grant.amount} · {grant.deadline}
                    </p>
                    <p className="text-xs text-[#8A5330] mt-1 italic">
                      {grant.fitReason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleStartApplication(grant.name)}
                    className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2.5 rounded-card text-xs md:text-sm transition-colors cursor-pointer shadow-card flex-1 md:flex-none text-center"
                  >
                    Start application
                  </button>
                  <button
                    onClick={() => handleNotRelevant(grant.id, grant.name)}
                    className="bg-white hover:bg-sage-50 text-sage-700 border border-sage-200 font-medium px-4 py-2.5 rounded-card text-xs md:text-sm transition-colors cursor-pointer flex-1 md:flex-none text-center shadow-card"
                  >
                    Not relevant
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
