"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export default function TermSheetsPage() {
  const termSheetRows = [
    { term: "Valuation (pre)", sheetA: "₦360M", sheetB: "₦320M" },
    { term: "Amount", sheetA: "₦90M", sheetB: "₦80M" },
    { term: "Option pool", sheetA: "10%", sheetB: "15%" },
    { term: "Liquidation pref", sheetA: "1x non-part.", sheetB: "2x participating" },
    { term: "Board seats", sheetA: "1 investor", sheetB: "2 investor" },
    { term: "Pro-rata rights", sheetA: "Standard", sheetB: "Super pro-rata" },
    { term: "Exclusivity", sheetA: "30 days", sheetB: "45 days" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-neutral-900">Term sheets</h1>
        <p className="text-sm text-neutral-500">Negotiate with clarity.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-modal border border-neutral-200/95 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200/80 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Term</th>
                  <th className="py-4 px-6">Sheet A</th>
                  <th className="py-4 px-6">Sheet B</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {termSheetRows.map((row, index) => (
                  <tr key={index} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-sm text-neutral-900">{row.term}</td>
                    <td className="py-4 px-6 text-sm text-neutral-700 font-medium">{row.sheetA}</td>
                    <td className="py-4 px-6 text-sm text-neutral-700 font-medium">{row.sheetB}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-accent-xf3eee2 border border-accent-200 rounded-modal p-4 md:p-5 flex items-start gap-3.5 shadow-card">
          <div className="text-accent-700 mt-0.5 shrink-0">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-accent-900">
              AI note: <span className="font-normal text-neutral-800">Sheet B&apos;s 2x participating liquidation preference is aggressive at this stage. Standard terms usually align closer to 1x non-participating (like Sheet A).</span>
            </p>
          </div>
        </div>

        <p className="text-[11px] text-neutral-400 italic">
          §1.4 Disclaimer: This is AI-assisted guidance, not professional legal advice. For anything non-standard, involve a licensed professional.
        </p>
      </div>
    </div>
  );
}
