"use client";

import React, { useState } from "react";
import { Sparkles, Download, Settings2 } from "lucide-react";
import { useFinanceApi } from "@/hooks/useFinanceApi";
import { useToast } from "../ToastContext";

type FinancialModelSubTab = "pnl" | "cashflow" | "balancesheet";

export default function FinancialModelPage() {
  const { pnlData, cashFlowModelData, balanceSheetData } = useFinanceApi();
  const { triggerToast } = useToast();

  const [isGenerated, setIsGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<FinancialModelSubTab>("pnl");
  const [revenueSensitivity, setRevenueSensitivity] = useState(0); // -20 to 20

  const handleGenerateModel = () => {
    setIsGenerating(true);
    triggerToast("Analyzing actuals and building assumptions...");
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
      triggerToast("3-statement model generated successfully!");
    }, 2000);
  };

  const handleExportXLSX = () => {
    triggerToast("Your financial model has been downloaded as an XLSX file.");
  };

  // Sensitivity multiplier
  const multiplier = 1 + (revenueSensitivity / 100);

  // Helper to safely apply multiplier to comma-separated strings
  const applyMultiplier = (valStr: string) => {
    const raw = parseFloat(valStr.replace(/,/g, ''));
    if (isNaN(raw)) return valStr;
    const computed = raw * multiplier;
    return computed.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Financial model</h1>
        <p className="text-sm text-sage-600 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-4 h-4 text-[#9C5B34]" />
          AI-built from your actuals and assumptions. Investor-grade structure, your numbers.
        </p>
      </div>

      {!isGenerated ? (
        <div className="bg-white rounded-modal border border-sage-200 p-12 shadow-card flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-sage-50 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-[#9C5B34]" />
          </div>
          <h2 className="text-2xl font-display font-bold text-sage-900 mb-2">Build your 3-statement model</h2>
          <p className="text-sm text-sage-500 mb-8 max-w-md">
            We will analyze your historical cash flow, connected bank accounts, and runway assumptions to generate a comprehensive 36-month P&L, Cash Flow, and Balance Sheet.
          </p>
          <button 
            onClick={handleGenerateModel}
            disabled={isGenerating}
            className={`bg-[#1e3b30] text-white px-6 py-3 rounded-card font-semibold shadow-sm transition-all ${
              isGenerating ? "opacity-70 cursor-not-allowed" : "hover:bg-[#152a22]"
            }`}
          >
            {isGenerating ? "Building model..." : "Generate Model"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 bg-sage-200/60 p-1 rounded-card w-fit border border-sage-300/50">
              <button
                onClick={() => setActiveSubTab("pnl")}
                className={`px-4 py-1.5 rounded-input text-sm font-medium transition-all cursor-pointer ${
                  activeSubTab === "pnl" ? "bg-white text-sage-900 shadow-card font-semibold" : "text-sage-600 hover:text-sage-900"
                }`}
              >
                P&L
              </button>
              <button
                onClick={() => setActiveSubTab("cashflow")}
                className={`px-4 py-1.5 rounded-input text-sm font-medium transition-all cursor-pointer ${
                  activeSubTab === "cashflow" ? "bg-white text-sage-900 shadow-card font-semibold" : "text-sage-600 hover:text-sage-900"
                }`}
              >
                Cash Flow
              </button>
              <button
                onClick={() => setActiveSubTab("balancesheet")}
                className={`px-4 py-1.5 rounded-input text-sm font-medium transition-all cursor-pointer ${
                  activeSubTab === "balancesheet" ? "bg-white text-sage-900 shadow-card font-semibold" : "text-sage-600 hover:text-sage-900"
                }`}
              >
                Balance Sheet
              </button>
            </div>

            <button
              onClick={handleExportXLSX}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-300 rounded-card text-sm font-medium text-sage-700 hover:bg-sage-50 shadow-card transition-colors cursor-pointer w-fit"
            >
              <Download className="w-4 h-4 text-sage-500" />
              <span>Export XLSX</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* TABLES */}
            <div className="lg:col-span-9 bg-white rounded-modal border border-sage-200/90 shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                {activeSubTab === "pnl" && (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-sage-100 text-[11px] font-bold text-sage-400 uppercase tracking-wider bg-sage-50/50">
                        <th className="py-4 px-6 font-semibold">P&L (₦K)</th>
                        <th className="py-4 px-4 font-semibold text-right">M1</th>
                        <th className="py-4 px-4 font-semibold text-right">M2</th>
                        <th className="py-4 px-4 font-semibold text-right">M3</th>
                        <th className="py-4 px-4 font-semibold text-right">M4</th>
                        <th className="py-4 px-4 font-semibold text-right">M5</th>
                        <th className="py-4 px-6 font-semibold text-right">M6</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                      {pnlData.map((row, index) => (
                        <tr key={index} className="hover:bg-sage-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-sage-900">{row.item}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.item === "Revenue" || row.item === "Gross profit" ? applyMultiplier(row.m1) : row.m1}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.item === "Revenue" || row.item === "Gross profit" ? applyMultiplier(row.m2) : row.m2}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.item === "Revenue" || row.item === "Gross profit" ? applyMultiplier(row.m3) : row.m3}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.item === "Revenue" || row.item === "Gross profit" ? applyMultiplier(row.m4) : row.m4}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.item === "Revenue" || row.item === "Gross profit" ? applyMultiplier(row.m5) : row.m5}</td>
                          <td className="py-4 px-6 text-right text-sage-600">{row.item === "Revenue" || row.item === "Gross profit" ? applyMultiplier(row.m6) : row.m6}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeSubTab === "cashflow" && (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-sage-100 text-[11px] font-bold text-sage-400 uppercase tracking-wider bg-sage-50/50">
                        <th className="py-4 px-6 font-semibold">CASH FLOW (₦K)</th>
                        <th className="py-4 px-4 font-semibold text-right">M1</th>
                        <th className="py-4 px-4 font-semibold text-right">M2</th>
                        <th className="py-4 px-4 font-semibold text-right">M3</th>
                        <th className="py-4 px-4 font-semibold text-right">M4</th>
                        <th className="py-4 px-4 font-semibold text-right">M5</th>
                        <th className="py-4 px-6 font-semibold text-right">M6</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                      {cashFlowModelData.map((row, index) => (
                        <tr key={index} className="hover:bg-sage-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-sage-900">{row.item}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m1}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m2}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m3}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m4}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m5}</td>
                          <td className="py-4 px-6 text-right text-sage-600">{row.m6}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {activeSubTab === "balancesheet" && (
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-sage-100 text-[11px] font-bold text-sage-400 uppercase tracking-wider bg-sage-50/50">
                        <th className="py-4 px-6 font-semibold">BALANCE SHEET (₦K)</th>
                        <th className="py-4 px-4 font-semibold text-right">M1</th>
                        <th className="py-4 px-4 font-semibold text-right">M2</th>
                        <th className="py-4 px-4 font-semibold text-right">M3</th>
                        <th className="py-4 px-4 font-semibold text-right">M4</th>
                        <th className="py-4 px-4 font-semibold text-right">M5</th>
                        <th className="py-4 px-6 font-semibold text-right">M6</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-100 text-sm">
                      {balanceSheetData.map((row, index) => (
                        <tr key={index} className="hover:bg-sage-50/60 transition-colors">
                          <td className="py-4 px-6 font-bold text-sage-900">{row.item}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m1}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m2}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m3}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m4}</td>
                          <td className="py-4 px-4 text-right text-sage-600">{row.m5}</td>
                          <td className="py-4 px-6 text-right text-sage-600">{row.m6}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* SENSITIVITY PANEL */}
            <div className="lg:col-span-3 bg-white rounded-modal border border-sage-200 p-6 shadow-card space-y-4">
              <div className="flex items-center gap-2 border-b border-sage-100 pb-3">
                <Settings2 className="w-4 h-4 text-sage-500" />
                <h3 className="font-bold text-sage-900">Sensitivity</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-sage-500 uppercase tracking-wider">Revenue Adj.</label>
                  <span className={`text-sm font-bold ${revenueSensitivity > 0 ? 'text-green-600' : revenueSensitivity < 0 ? 'text-[#B0483B]' : 'text-sage-900'}`}>
                    {revenueSensitivity > 0 ? '+' : ''}{revenueSensitivity}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-20" max="20" step="5"
                  value={revenueSensitivity}
                  onChange={(e) => {
                    setRevenueSensitivity(Number(e.target.value));
                    triggerToast(`Recalculated model with ${e.target.value}% revenue adjustment`);
                  }}
                  className="w-full accent-[#9c5b34]" 
                />
                <div className="flex justify-between text-[10px] text-sage-400 font-bold">
                  <span>-20%</span>
                  <span>0%</span>
                  <span>+20%</span>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
