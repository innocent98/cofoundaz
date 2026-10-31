"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { replaceUrl } from "@/lib/replace-url";
import { useRolePlay } from "@/hooks/useSalesCoach";
import { useAiStatus } from "@/hooks/useAiStatus";
import { CallPrepPanel, RolePlayPanel } from "@/components/sales/coach";

type AICoachSubTab = "Role-play" | "Call prep";

function AICoachContent() {
  const params = useSearchParams();
  const rp = useRolePlay();
  const ai = useAiStatus();
  const limit = { overBudget: ai.isOverBudget, resetsAt: ai.formattedResetsAt };

  // ?tab=prep&deal=<id> deep-links to a deal's call prep (the deal drawer links here).
  const initialTab: AICoachSubTab = params.get("tab") === "prep" ? "Call prep" : "Role-play";
  const [tab, setTab] = useState<AICoachSubTab>(initialTab);
  const [dealId, setDealId] = useState<string>(params.get("deal") ?? "");

  const pickTab = (next: AICoachSubTab) => {
    setTab(next);
    replaceUrl(next === "Call prep" ? "/sales/coach?tab=prep" : "/sales/coach");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-neutral-900">AI sales coach</h1>
        <p className="text-sm text-neutral-600 font-medium mt-0.5">Rehearse here, win out there.</p>
      </div>

      <div role="tablist" aria-label="AI coach" className="flex items-center gap-2">
        {(["Role-play", "Call prep"] as AICoachSubTab[]).map((subTab) => {
          const isActive = tab === subTab;
          return (
            <button
              key={subTab}
              role="tab"
              aria-selected={isActive}
              onClick={() => pickTab(subTab)}
              className={`px-4 py-2 rounded-card text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-accent-200 text-accent-x2c220b shadow-card"
                  : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200/80"
              }`}
            >
              {subTab}
            </button>
          );
        })}
      </div>

      {tab === "Role-play" && <RolePlayPanel rp={rp} limit={limit} />}
      {tab === "Call prep" && <CallPrepPanel dealId={dealId} onDealChange={setDealId} limit={limit} />}
    </div>
  );
}

export default function AICoachPage() {
  return (
    <Suspense fallback={null}>
      <AICoachContent />
    </Suspense>
  );
}
