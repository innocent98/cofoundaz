"use client";

import React, { useState } from "react";
import { useSalesApi } from "@/hooks/useSalesApi";
import { useToast } from "../ToastContext";

export default function AccountsPage() {
  const { accounts } = useSalesApi();
  const { triggerToast } = useToast();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || "");
  const [activityNote, setActivityNote] = useState("");

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId) || accounts[0];

  const handleLogActivity = () => {
    if (!activityNote.trim()) return;
    triggerToast(`Activity logged for ${selectedAccount.name}`);
    setActivityNote("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn items-start">
      {/* ACCOUNTS LIST (MASTER) */}
      <div className="lg:col-span-4 bg-white rounded-modal border border-sage-200/90 p-3 space-y-2 shadow-card h-full max-h-[800px] overflow-y-auto">
        {accounts.map((acc) => {
          const isSelected = acc.id === selectedAccountId;
          return (
            <div
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={`p-4 rounded-card cursor-pointer transition-all ${
                isSelected 
                  ? "bg-[#f0f4f1] border border-green-900/10 shadow-card" 
                  : "hover:bg-sage-50/80 border border-transparent"
              }`}
            >
              <h4 className="font-display font-bold text-sage-900 text-base">{acc.name}</h4>
              <div className="text-xs text-sage-500 mt-1 font-medium">{acc.openDealsText}</div>
            </div>
          );
        })}
      </div>

      {/* ACCOUNT DETAIL (DETAIL) */}
      {selectedAccount && (
        <div className="lg:col-span-8 bg-white rounded-modal border border-sage-200/95 p-6 md:p-8 shadow-card space-y-8">
          
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-sage-900">
              {selectedAccount.name}
            </h2>
            <p className="text-sm text-sage-500 font-medium">
              {selectedAccount.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f7f9f8] rounded-card p-4 border border-sage-200/60 space-y-1">
              <span className="text-[11px] font-bold text-sage-400 uppercase tracking-wider block">
                OPEN DEALS
              </span>
              <span className="text-2xl font-display font-bold text-sage-900">
                {selectedAccount.openDealsCount}
              </span>
            </div>

            <div className="bg-[#f7f9f8] rounded-card p-4 border border-sage-200/60 space-y-1">
              <span className="text-[11px] font-bold text-sage-400 uppercase tracking-wider block">
                LIFETIME VALUE
              </span>
              <span className="text-2xl font-display font-bold text-sage-900">
                {selectedAccount.lifetimeValue}
              </span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-sage-400 uppercase tracking-wider">
              ACTIVITY TIMELINE
            </h3>

            <div className="space-y-3">
              {selectedAccount.activities.map((act, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-sage-100 last:border-0">
                  <div className="flex items-center gap-2.5 text-sage-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#9C5B34]"></span>
                    <span>{act.text}</span>
                  </div>
                  <span className="text-xs text-sage-400 font-medium whitespace-nowrap">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-sage-100 space-y-3">
            <h3 className="text-xs font-bold text-sage-400 uppercase tracking-wider">
              LOG ACTIVITY
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Met for coffee, sent deck..." 
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                className="flex-1 bg-sage-50 border border-sage-200 rounded-input px-3 py-2 text-sm focus:outline-none focus:border-sage-400"
              />
              <button 
                onClick={handleLogActivity}
                className="bg-[#1e4836] hover:bg-[#153427] text-white font-semibold px-4 py-2 rounded-input text-sm transition-colors shadow-card shrink-0"
              >
                Log
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
