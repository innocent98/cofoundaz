"use client";

import React, { useState } from "react";
import { useFinanceApi, formatCurrency } from "@/hooks/useFinanceApi";

export default function RunwayPage() {
  const { runwayMonths, monthlyBurnMinor } = useFinanceApi();
  const [scenario, setScenario] = useState<"Base" | "Best" | "Worst">("Base");
  const [growthPercent, setGrowthPercent] = useState(15);
  const [hiringSpend, setHiringSpend] = useState(500);

  // Calculate dynamic cash out date roughly based on runwayMonths
  const currentDate = new Date();
  let adjustedRunway = runwayMonths;
  if (scenario === "Best") adjustedRunway += 2.4;
  if (scenario === "Worst") adjustedRunway -= 1.8;

  const cashOutDate = new Date(currentDate.setMonth(currentDate.getMonth() + adjustedRunway));
  const cashOutFormatted = cashOutDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Runway & Scenarios</h1>
        <p className="text-sm text-sage-600">Model your cash runway under different growth and hiring assumptions.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-modal border border-sage-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            {["Base", "Best", "Worst"].map((scen) => (
              <button
                key={scen}
                onClick={() => setScenario(scen as "Base" | "Best" | "Worst")}
                className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                  scenario === scen
                    ? "bg-[#1e3b30] text-white border-[#1e3b30]"
                    : "bg-sage-50 text-sage-600 border-sage-200 hover:bg-sage-100"
                }`}
              >
                {scen} Case
              </button>
            ))}
          </div>
          <h2 className="text-4xl font-display font-bold text-sage-900 mt-2">
            {adjustedRunway.toFixed(1)} Months
          </h2>
          <p className="text-sm text-sage-500 mt-2 font-medium">
            At <span className="lowercase">{scenario}</span> case, cash out: <strong className="text-sage-900">{cashOutFormatted}</strong>.
          </p>
        </div>
        <div className="w-full md:w-auto p-4 bg-sage-50 border border-sage-200 rounded-card">
          <p className="text-xs text-sage-500 font-medium uppercase mb-1">Avg Net Burn (Scenario)</p>
          <p className="text-xl font-bold text-[#B0483B]">
            -{formatCurrency(monthlyBurnMinor * (scenario === "Worst" ? 1.2 : scenario === "Best" ? 0.85 : 1))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ASSUMPTIONS PANEL */}
        <div className="lg:col-span-4 bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-6">
          <h3 className="font-bold text-sage-900 border-b border-sage-100 pb-3">Assumptions</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-sage-500 uppercase">MoM Growth %</label>
                <span className="text-sm font-bold text-sage-900">{growthPercent}%</span>
              </div>
              <input 
                type="range" 
                min="0" max="100" 
                value={growthPercent}
                onChange={(e) => setGrowthPercent(Number(e.target.value))}
                className="w-full accent-[#9c5b34]" 
              />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-sage-500 uppercase">Hiring Lines (₦K/mo)</label>
                <span className="text-sm font-bold text-sage-900">{hiringSpend}</span>
              </div>
              <input 
                type="range" 
                min="0" max="5000" step="100"
                value={hiringSpend}
                onChange={(e) => setHiringSpend(Number(e.target.value))}
                className="w-full accent-[#9c5b34]" 
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-sage-500 uppercase">One-off Costs (₦K)</label>
              <input 
                type="number" 
                placeholder="e.g. 5000"
                className="w-full border border-sage-200 rounded-input px-3 py-2 text-sm bg-sage-50 focus:outline-none focus:border-sage-400"
              />
            </div>
          </div>
        </div>

        {/* PROJECTION CHART MOCKUP */}
        <div className="lg:col-span-8 bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-6 flex flex-col">
          <h3 className="font-bold text-sage-900 border-b border-sage-100 pb-3">Cash Balance Projection</h3>
          
          <div className="flex-1 min-h-[250px] relative mt-4 border-l border-b border-sage-200">
            {/* Base line */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 0,10 Q 30,20 60,60 T 100,95" fill="none" stroke="#1e3b30" strokeWidth="2" strokeDasharray={scenario !== "Base" ? "4" : "0"} className={scenario === "Base" ? "opacity-100" : "opacity-30"} />
              <path d="M 0,10 Q 30,15 60,40 T 100,80" fill="none" stroke="#9c5b34" strokeWidth="2" className={scenario === "Best" ? "opacity-100" : "opacity-0"} />
              <path d="M 0,10 Q 30,30 50,70 T 80,100" fill="none" stroke="#B0483B" strokeWidth="2" className={scenario === "Worst" ? "opacity-100" : "opacity-0"} />
            </svg>
            <div className="absolute bottom-0 left-0 w-full border-t border-red-300 border-dashed"></div>
            <span className="absolute bottom-0 right-2 text-[10px] text-red-500 font-bold bg-white px-1 -translate-y-1/2">Zero Cash Line</span>
          </div>
        </div>

      </div>
    </div>
  );
}
