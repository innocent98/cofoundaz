"use client";

import React, { useState } from "react";
import { useFundingApi } from "@/hooks/useFundingApi";
import { useToast } from "../ToastContext";

export default function CapTablePage() {
  const { capTable } = useFundingApi();
  const { triggerToast } = useToast();

  const [newMoney, setNewMoney] = useState<string>("90");
  const [preMoney, setPreMoney] = useState<string>("360");

  const handleSaveScenario = () => {
    triggerToast("Round scenario saved.");
  };

  // Safe parsing to calculate dilution
  const newMoneyVal = parseFloat(newMoney) || 0;
  const preMoneyVal = parseFloat(preMoney) || 1;
  const postMoneyVal = preMoneyVal + newMoneyVal;
  
  // Example mock calculation: if founders have 70% of pre-money, what is their % of post-money?
  // New founder % = (70 * preMoney) / postMoney
  const founderOldPct = 70;
  const founderNewPct = postMoneyVal > 0 ? ((founderOldPct * preMoneyVal) / postMoneyVal).toFixed(1) : 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-neutral-900 mb-1">Cap table</h1>
          <p className="text-sm text-neutral-600">Manage equity distribution and model future funding rounds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-modal border border-neutral-200/95 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200/80 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Stakeholder</th>
                  <th className="py-4 px-6">Security</th>
                  <th className="py-4 px-6">Vesting</th>
                  <th className="py-4 px-6 text-right">Ownership</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {capTable.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-sm text-neutral-900">{row.holder}</td>
                    <td className="py-4 px-6 text-sm text-neutral-500">{row.security}</td>
                    <td className="py-4 px-6 text-xs text-neutral-500">{row.vesting}</td>
                    <td className="py-4 px-6 text-sm font-bold text-neutral-900 text-right">{row.ownershipPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-modal border border-neutral-200/95 shadow-card p-6 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-brand-hover"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  strokeDasharray="70 30"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-accent-700"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  strokeDasharray="18 82"
                  strokeDashoffset="-70"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-brand-xa2c2b0"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  strokeDasharray="12 88"
                  strokeDashoffset="-88"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col text-center">
                <div className="w-16 h-16 rounded-full bg-white"></div>
              </div>
            </div>
            <p className="text-xs text-neutral-600 font-medium text-center">
              Founders 70% · Options 18% · SAFE 12%
            </p>
          </div>

          <div className="bg-brand-rail-deep rounded-modal p-6 text-white space-y-4 shadow-raised">
            <h3 className="font-display font-semibold text-base">Model a round</h3>
            
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                New money (₦M)
              </label>
              <input
                type="text"
                value={newMoney}
                onChange={(e) => setNewMoney(e.target.value)}
                className="w-full bg-brand-x16382c border border-brand-x235342 rounded-card px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-accent-600/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                Pre-money (₦M)
              </label>
              <input
                type="text"
                value={preMoney}
                onChange={(e) => setPreMoney(e.target.value)}
                className="w-full bg-brand-x16382c border border-brand-x235342 rounded-card px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-accent-600/50"
              />
            </div>

            <div className="bg-brand-x16382c border border-brand-x235342 rounded-card p-3.5 text-xs text-neutral-200">
              You would go from <span className="font-bold text-white">{founderOldPct}%</span> to <span className="font-bold text-accent-200">{founderNewPct}%</span> founder ownership.
            </div>

            <button
              onClick={handleSaveScenario}
              className="w-full bg-accent-600 hover:bg-accent-700 text-white font-semibold py-3 px-4 rounded-card text-sm transition-colors cursor-pointer text-center shadow-card"
            >
              Save as scenario
            </button>
          </div>

          <p className="text-[11px] text-neutral-400 italic">
            §1.4 Disclaimer: The Cap Table modeler provides estimates based on standard dilution scenarios. This tool does not substitute professional legal or financial advice.
          </p>
        </div>
      </div>
    </div>
  );
}
