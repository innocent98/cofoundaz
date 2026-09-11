"use client";

import React, { useState } from "react";
import { Plus, Copy, FileText } from "lucide-react";
import { useToast } from "../ToastContext";
import { formatCurrency } from "@/hooks/useFinanceApi";

export default function BudgetsPage() {
  const { triggerToast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState("March 2026");
  const [budgetsCreated, setBudgetsCreated] = useState(true);

  const mockBudgets = [
    { dept: "Engineering", spent: 45000000, limit: 250000000 },
    { dept: "Marketing", spent: 180000000, limit: 150000000 }, // Over budget
    { dept: "Operations", spent: 135000000, limit: 250000000 },
    { dept: "Sales", spent: 180000000, limit: 250000000 },
    { dept: "General & Admin", spent: 225000000, limit: 250000000 },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Department Budgets</h1>
          <p className="text-sm text-sage-600">Allocate and monitor spending limits across teams.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white border border-sage-200 rounded-card px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#9c5b34]"
          >
            <option>March 2026</option>
            <option>February 2026</option>
            <option>January 2026</option>
          </select>
          <button className="bg-[#9C5B34] text-white px-4 py-2 rounded-card text-sm font-medium flex items-center gap-1.5 hover:bg-[#8A5330] shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </div>
      </div>

      {!budgetsCreated ? (
        <div className="bg-white rounded-modal border border-sage-200 shadow-card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-sage-500" />
          </div>
          <h3 className="text-xl font-display font-bold text-sage-900 mb-2">No budget set for {selectedMonth}</h3>
          <p className="text-sm text-sage-500 mb-6 max-w-sm">
            You haven't defined category limits for this period. Draft a new one or carry over from last month.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setBudgetsCreated(true);
                triggerToast("Budget drafted from actuals.");
              }}
              className="bg-[#1e3b30] text-white px-5 py-2.5 rounded-card text-sm font-semibold hover:bg-[#152a22] transition-colors shadow-sm"
            >
              Draft budget from actuals
            </button>
            <button 
              onClick={() => {
                setBudgetsCreated(true);
                triggerToast(`Copied budget from previous month into ${selectedMonth}.`);
              }}
              className="bg-white text-sage-700 border border-sage-200 px-5 py-2.5 rounded-card text-sm font-semibold hover:bg-sage-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Copy className="w-4 h-4" /> Copy last month
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => triggerToast(`Copied budget from previous month into ${selectedMonth}.`)}
              className="text-xs font-bold text-[#9c5b34] hover:underline flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy last month's budget
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockBudgets.map((b, i) => {
              const variance = b.spent - b.limit;
              const isOver = variance > 0;
              const percent = Math.min(100, (b.spent / b.limit) * 100);
              
              return (
                <div key={i} className={`bg-white p-5 rounded-modal border ${isOver ? 'border-[#ffcccc]' : 'border-sage-200'} space-y-4 shadow-card transition-colors`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-sage-900">{b.dept}</h3>
                      <span className="text-xs text-sage-500 font-medium">{selectedMonth} Allocation</span>
                    </div>
                    {isOver && (
                      <span className="bg-[#fff0f0] text-[#B0483B] text-[10px] font-bold px-2 py-0.5 rounded border border-[#ffcccc] uppercase tracking-wider">
                        Over Budget
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className={isOver ? "text-[#B0483B]" : "text-[#1e3b30]"}>{percent.toFixed(0)}% used</span>
                      <span className="text-sage-400">Limit: {formatCurrency(b.limit)}</span>
                    </div>
                    <div className="w-full bg-sage-100 rounded-full h-2 overflow-hidden">
                      <div className={`${isOver ? 'bg-[#B0483B]' : 'bg-[#1e3b30]'} h-full rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-sage-100 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-sage-400 font-bold uppercase tracking-wider">Spent</span>
                      <span className="font-semibold text-sage-900">{formatCurrency(b.spent)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-sage-400 font-bold uppercase tracking-wider">Variance</span>
                      <span className={`font-semibold ${isOver ? 'text-[#B0483B]' : 'text-green-600'}`}>
                        {isOver ? '+' : ''}{formatCurrency(variance)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
