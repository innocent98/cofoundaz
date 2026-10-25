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
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Grants</h1>
        <p className="text-sm text-neutral-500">Discover and apply for non-dilutive capital.</p>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">AI MATCHES</h3>

        <div className="space-y-4">
          {grantMatches.length === 0 ? (
            <div className="bg-white rounded-modal border border-neutral-200 p-8 text-center space-y-2 shadow-card">
              <p className="text-neutral-900 font-semibold">I scan for grants that fit your profile.</p>
              <p className="text-neutral-500 text-sm">New matches land here.</p>
            </div>
          ) : (
            grantMatches.map((grant) => (
              <div 
                key={grant.id}
                className="bg-white rounded-modal border border-neutral-200/95 p-5 md:p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-5">
                  <div className="bg-neutral-xe2ede6 text-brand-hover px-3.5 py-2.5 rounded-card font-display font-bold text-center shrink-0 min-w-[70px]">
                    <div className="text-base md:text-lg leading-tight">{grant.fitScore}%</div>
                    <div className="text-[10px] uppercase font-body tracking-wider opacity-80">FIT</div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-semibold text-base text-neutral-900">{grant.name}</h4>
                    <p className="text-xs text-neutral-500 font-medium">
                      {grant.funder} · {grant.amount} · {grant.deadline}
                    </p>
                    <p className="text-xs text-accent-700 mt-1 italic">
                      {grant.fitReason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <button
                    onClick={() => handleStartApplication(grant.name)}
                    className="bg-accent-600 hover:bg-accent-700 text-white font-semibold px-4 py-2.5 rounded-card text-xs md:text-sm transition-colors cursor-pointer shadow-card flex-1 md:flex-none text-center"
                  >
                    Start application
                  </button>
                  <button
                    onClick={() => handleNotRelevant(grant.id, grant.name)}
                    className="bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-medium px-4 py-2.5 rounded-card text-xs md:text-sm transition-colors cursor-pointer flex-1 md:flex-none text-center shadow-card"
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
