"use client";

import React from "react";
import { useFinanceApi, formatCurrency } from "@/hooks/useFinanceApi";
import { ArrowUpRight, ArrowDownRight, AlertTriangle, MessageSquare } from "lucide-react";

export default function CashFlowPage() {
  const { runwayMonths, monthlyBurnMinor, cashOnHandMinor, monthlyRevenueMinor, transactions } = useFinanceApi();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Cash Flow Analytics</h1>
        <p className="text-sm text-sage-600">Monitor cash inflows, outflows, and net liquidity positions.</p>
      </div>

      {runwayMonths < 6 && (
        <div className="bg-[#fff0f0] border border-[#ffcccc] rounded-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-card text-[#B0483B]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#B0483B]">Runway under 6 months.</h4>
              <p className="text-sm text-[#B0483B] opacity-90 mt-0.5">Let's look at levers — costs, pricing, or funding.</p>
            </div>
          </div>
          <button className="bg-white border border-[#ffcccc] text-[#B0483B] hover:bg-[#fff5f5] px-4 py-2 rounded-card text-sm font-semibold shadow-card transition-colors flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Ask Finance Advisor
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
          <p className="text-xs text-sage-500 font-medium uppercase">Cash on Hand</p>
          <p className="text-2xl font-bold text-sage-900 mt-1">{formatCurrency(cashOnHandMinor)}</p>
        </div>
        <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
          <p className="text-xs text-sage-500 font-medium uppercase">Monthly Burn</p>
          <p className="text-2xl font-bold text-[#B0483B] mt-1">-{formatCurrency(monthlyBurnMinor)}</p>
          <span className="text-xs text-sage-500 flex items-center gap-1 mt-2 font-medium">Net 3-month avg</span>
        </div>
        <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
          <p className="text-xs text-sage-500 font-medium uppercase">Monthly Revenue</p>
          <p className="text-2xl font-bold text-sage-900 mt-1">{formatCurrency(monthlyRevenueMinor)}</p>
          <span className="text-xs text-green-600 flex items-center gap-1 mt-2 font-medium"><ArrowUpRight className="w-3.5 h-3.5" /> +12% from last month</span>
        </div>
        <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
          <p className="text-xs text-sage-500 font-medium uppercase">Runway</p>
          <p className="text-2xl font-bold text-sage-900 mt-1">{runwayMonths} months</p>
          <span className="text-xs text-red-600 flex items-center gap-1 mt-2 font-medium"><ArrowDownRight className="w-3.5 h-3.5" /> Trending down</span>
        </div>
      </div>

      <div className="bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-4">
        <h3 className="font-bold text-sage-900">Cash Flow (6 Months)</h3>
        <div className="h-48 w-full flex items-end justify-between gap-2 border-b border-sage-100 pb-2">
          {/* Mock chart bars */}
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1 items-center h-full group">
              <div className="w-full flex gap-1 justify-center items-end h-[80%]">
                <div className="w-1/3 bg-[#1e3b30] rounded-t-sm transition-all" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
                <div className="w-1/3 bg-[#B0483B] rounded-t-sm transition-all" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
              </div>
              <span className="text-[10px] text-sage-400 font-medium">M{i}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-sage-600 justify-center">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#1e3b30]"></div> Inflows</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded bg-[#B0483B]"></div> Outflows</div>
        </div>
      </div>

      <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
        <div className="p-4 border-b border-sage-100 flex items-center justify-between bg-sage-50/50">
          <h3 className="font-bold text-sage-900">Recent Transactions</h3>
          <span className="bg-[#fcf5eb] text-[#9c5b34] text-xs font-bold px-2.5 py-1 rounded-full border border-[#f5e3d3]">
            1 need a category
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-sage-50/50 border-b border-sage-100 text-xs font-bold text-sage-400 uppercase tracking-wider">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-4">Description</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Source</th>
                <th className="py-4 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 text-sm">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-sage-50/50 transition-colors">
                  <td className="py-4 px-6 text-sage-600 font-medium">{tx.date}</td>
                  <td className="py-4 px-4 font-semibold text-sage-900">{tx.description}</td>
                  <td className="py-4 px-4">
                    {tx.category ? (
                      <span className="text-sage-700 bg-white border border-sage-200 px-2 py-1 rounded text-xs">
                        {tx.category}
                      </span>
                    ) : (
                      <select className="text-xs bg-white border border-[#9c5b34] text-[#9c5b34] rounded px-2 py-1 outline-none font-medium">
                        <option>Select category...</option>
                        <option>Software</option>
                        <option>Hardware</option>
                      </select>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="bg-sage-100 text-sage-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-sage-200">
                      {tx.source}
                    </span>
                  </td>
                  <td className={`py-4 px-6 font-bold text-right ${tx.direction === 'in' ? 'text-[#1e3b30]' : 'text-sage-900'}`}>
                    {tx.direction === 'in' ? '+' : '-'}{formatCurrency(tx.amountMinor, tx.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
