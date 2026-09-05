"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar";
import { 
  Sparkles, 
  Download, 
  Bell, 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Check, 
  Plus 
} from "lucide-react";

type FinanceTab =
  | "Cash flow"
  | "Runway"
  | "Budgets"
  | "Invoices"
  | "Expenses"
  | "Financial model"
  | "Integrations";

type FinancialModelSubTab = "pnl" | "cashflow" | "balancesheet";

interface TableRowItem {
  item: string;
  m1: string;
  m2: string;
  m3: string;
  m4: string;
  m5: string;
  m6: string;
}

export default function FinanceHubApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<FinanceTab>("Financial model");
  const [activeSubTab, setActiveSubTab] = useState<FinancialModelSubTab>("pnl");
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>("");

  // Integration states matching the exact reference cards layout
  const [integrations, setIntegrations] = useState([
    { id: "quickbooks", name: "QuickBooks", status: "Not connected", description: "Not connected", initials: "QB" },
    { id: "xero", name: "Xero", status: "Not connected", description: "Not connected", initials: "X" },
    { id: "bank", name: "Bank connection", status: "Connected", description: "Connected as GTBank · synced 2h ago", initials: "🏦" },
    { id: "stripe", name: "Stripe", status: "Connected", description: "Connected as Kolo Ltd · synced 2h ago", initials: "S" },
  ]);

  // Data sets for Financial Model
  const pnlData: TableRowItem[] = [
    { item: "Revenue", m1: "1,600", m2: "1,790", m3: "2,010", m4: "2,250", m5: "2,520", m6: "2,820" },
    { item: "COGS", m1: "320", m2: "358", m3: "402", m4: "450", m5: "504", m6: "564" },
    { item: "Gross profit", m1: "1,280", m2: "1,432", m3: "1,608", m4: "1,800", m5: "2,016", m6: "2,256" },
    { item: "Opex", m1: "4,900", m2: "4,950", m3: "5,010", m4: "5,080", m5: "5,160", m6: "5,250" },
    { item: "Net", m1: "-3,620", m2: "-3,518", m3: "-3,402", m4: "-3,280", m5: "-3,144", m6: "-2,994" },
  ];

  const cashFlowModelData: TableRowItem[] = [
    { item: "Opening", m1: "41,000", m2: "37,380", m3: "33,862", m4: "30,460", m5: "27,180", m6: "24,036" },
    { item: "Net burn", m1: "-3,620", m2: "-3,518", m3: "-3,402", m4: "-3,280", m5: "-3,144", m6: "-2,994" },
    { item: "Closing", m1: "37,380", m2: "33,862", m3: "30,460", m4: "27,180", m5: "24,036", m6: "21,042" },
  ];

  const balanceSheetData: TableRowItem[] = [
    { item: "Cash", m1: "37,380", m2: "33,862", m3: "30,460", m4: "27,180", m5: "24,036", m6: "21,042" },
    { item: "Receivables", m1: "1,200", m2: "1,340", m3: "1,510", m4: "1,690", m5: "1,890", m6: "2,110" },
    { item: "Total assets", m1: "38,580", m2: "35,202", m3: "31,970", m4: "28,870", m5: "25,926", m6: "23,152" },
  ];

  const handleExportXLSX = () => {
    setNotificationMessage("Your financial model has been downloaded as an XLSX file.");
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  const handleToggleConnection = (id: string, name: string, currentStatus: string) => {
    if (currentStatus === "Connected") {
      setIntegrations(prev => prev.map(item => item.id === id ? { ...item, status: "Not connected", description: "Not connected" } : item));
      setNotificationMessage(`${name} disconnected.`);
    } else {
      setIntegrations(prev => prev.map(item => item.id === id ? { ...item, status: "Connected", description: `Connected as ${name} · synced just now` } : item));
      setNotificationMessage(`Connecting to ${name}...`);
    }

    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#2c3531] flex font-body relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 block bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* FLOATING NOTIFICATION POPUP */}
      {showNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-[#0e271f] text-white px-5 py-3 rounded-card shadow-raised transition-all duration-300 border border-sage-700">
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-sm font-medium">{notificationMessage}</p>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 w-full">
        
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-green-100 shadow-card w-full">
          <div className="flex w-full items-center justify-between gap-2 px-6 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                onClick={() => setIsSidebarOpen((open) => !open)}
                className="lg:hidden h-8 w-8 rounded-full bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-[11px] shadow-card hover:opacity-90 transition-opacity shrink-0"
              >
                C
              </button>

              <div className="flex min-w-0 items-center gap-1 text-sm text-sage-500">
                <span className="truncate hover:text-sage-700 cursor-pointer font-medium text-sm">Workspace</span>
                <span className="text-sage-400">/</span>
                <span className="truncate font-bold text-[#1E2923] text-base">Finance Hub</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="bg-green-100 text-green-900 px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 border border-green-200">
                <span>Health</span>
                <span className="font-bold text-[10px] sm:text-xs text-green-900">72</span>
                <span className="text-[10px]">↑</span>
              </div>

              <button
                aria-label="Notifications"
                className="relative p-2 rounded-full bg-sage-100/80 border border-sage-200/60 text-sage-700 hover:bg-sage-200/60 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="bg-copper-600 hover:bg-copper-700 text-white font-semibold px-2.5 py-1.5 h-7 rounded-full text-xs transition-colors flex items-center gap-1 cursor-pointer leading-none">
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Invite</span>
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-white px-6 py-2">
            {(
              [
                "Cash flow",
                "Runway",
                "Budgets",
                "Invoices",
                "Expenses",
                "Financial model",
                "Integrations",
              ] as FinanceTab[]
            ).map((tab) => {
              const isActive = activeNavTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveNavTab(tab)}
                  className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-copper-200 text-copper-700 shadow-card font-semibold"
                      : "bg-sage-100 text-sage-700 hover:bg-green-100"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </nav>
        </header>

        {/* MAIN BODY VIEW ROUTER */}
        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full space-y-6">
          
          {/* 1. CASH FLOW TAB VIEW */}
          {activeNavTab === "Cash flow" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Cash Flow Analytics</h1>
                <p className="text-sm text-sage-600">Monitor cash inflows, outflows, and net liquidity positions.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
                  <p className="text-xs text-sage-500 font-medium uppercase">Total Inflows (M1)</p>
                  <p className="text-2xl font-bold text-sage-900 mt-1">₦1,600K</p>
                  <span className="text-xs text-green-600 flex items-center gap-1 mt-2 font-medium"><ArrowUpRight className="w-3.5 h-3.5" /> +12% from last month</span>
                </div>
                <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
                  <p className="text-xs text-sage-500 font-medium uppercase">Total Outflows (M1)</p>
                  <p className="text-2xl font-bold text-sage-900 mt-1">₦5,220K</p>
                  <span className="text-xs text-red-600 flex items-center gap-1 mt-2 font-medium"><ArrowDownRight className="w-3.5 h-3.5" /> -3% optimized</span>
                </div>
                <div className="bg-white p-5 rounded-modal border border-sage-200 shadow-card">
                  <p className="text-xs text-sage-500 font-medium uppercase">Closing Balance (M6)</p>
                  <p className="text-2xl font-bold text-sage-900 mt-1">₦21,042K</p>
                  <span className="text-xs text-sage-500 mt-2 block">Stable projected horizon</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. RUNWAY TAB VIEW */}
          {activeNavTab === "Runway" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Runway & Burn Rate</h1>
                <p className="text-sm text-sage-600">Track your operational longevity based on current cash reserves.</p>
              </div>
              <div className="bg-white rounded-modal border border-sage-200 p-8 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200">Healthy Buffer</span>
                  <h2 className="text-4xl font-display font-bold text-sage-900 mt-3">11.6 Months</h2>
                  <p className="text-sm text-sage-500 mt-1">Estimated runway remaining at current average net burn of ₦3,350K/mo.</p>
                </div>
                <div className="w-full md:w-auto flex gap-3">
                  <button className="px-4 py-2.5 bg-sage-900 text-white rounded-card text-sm font-medium hover:bg-sage-800 transition">Simulate Hiring Impact</button>
                </div>
              </div>
            </div>
          )}

          {/* 3. BUDGETS TAB VIEW */}
          {activeNavTab === "Budgets" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Department Budgets</h1>
                  <p className="text-sm text-sage-600">Allocate and monitor spending limits across teams.</p>
                </div>
                <button className="bg-[#9C5B34] text-white px-4 py-2 rounded-card text-sm font-medium flex items-center gap-1.5 hover:bg-[#9C5B34]">
                  <Plus className="w-4 h-4" /> New Budget
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {["Engineering", "Marketing", "Operations", "Sales", "General & Admin"].map((dept, i) => (
                  <div key={i} className="bg-white p-5 rounded-modal border border-sage-200 space-y-3 shadow-card">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sage-900">{dept}</h3>
                      <span className="text-xs text-sage-400 font-medium">Q1 Allocation</span>
                    </div>
                    <div className="w-full bg-sage-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-[#0e271f] h-full rounded-full" style={{ width: `${(i + 2) * 15}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-sage-500 font-medium">
                      <span>Spent: ₦{(i + 1) * 450}K</span>
                      <span>Limit: ₦2,500K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. INVOICES TAB VIEW */}
          {activeNavTab === "Invoices" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Invoices</h1>
                  <p className="text-sm text-sage-600">Manage client billings, payments, and receivables.</p>
                </div>
                <button className="bg-[#9C5B34] text-white px-4 py-2 rounded-card text-sm font-medium flex items-center gap-1.5 hover:bg-[#9C5B34]">
                  <Plus className="w-4 h-4" /> Create Invoice
                </button>
              </div>
              <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sage-50/50 border-b border-sage-100 text-xs text-sage-400 font-bold uppercase">
                      <th className="py-4 px-6">Invoice ID</th>
                      <th className="py-4 px-4">Client</th>
                      <th className="py-4 px-4">Due Date</th>
                      <th className="py-4 px-4">Amount</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100 text-sm">
                    {["INV-2026-001", "INV-2026-002", "INV-2026-003"].map((inv, idx) => (
                      <tr key={idx} className="hover:bg-sage-50/50">
                        <td className="py-4 px-6 font-semibold text-sage-900">{inv}</td>
                        <td className="py-4 px-4 text-sage-600">Enterprise Partner {idx + 1}</td>
                        <td className="py-4 px-4 text-sage-500">Mar {10 + idx}, 2026</td>
                        <td className="py-4 px-4 font-medium text-sage-900">₦{(idx + 1) * 600},000</td>
                        <td className="py-4 px-6">
                          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">Paid</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. EXPENSES TAB VIEW */}
          {activeNavTab === "Expenses" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Expenses</h1>
                  <p className="text-sm text-sage-600">Track corporate card transactions and operational spend.</p>
                </div>
                <button className="bg-[#9C5B34] text-white px-4 py-2 rounded-card text-sm font-medium flex items-center gap-1.5 hover:bg-[#9C5B34]">
                  <Plus className="w-4 h-4" /> Add Expense
                </button>
              </div>
              <div className="bg-white rounded-modal border border-sage-200 overflow-hidden shadow-card">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-sage-50/50 border-b border-sage-100 text-xs text-sage-400 font-bold uppercase">
                      <th className="py-4 px-6">Vendor</th>
                      <th className="py-4 px-4">Category</th>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-6">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100 text-sm">
                    {["AWS Cloud Services", "Google Workspace", "Office Lease", "Notion Team"].map((vendor, idx) => (
                      <tr key={idx} className="hover:bg-sage-50/50">
                        <td className="py-4 px-6 font-semibold text-sage-900">{vendor}</td>
                        <td className="py-4 px-4 text-sage-600">Infrastructure & SaaS</td>
                        <td className="py-4 px-4 text-sage-500">Feb {15 + idx}, 2026</td>
                        <td className="py-4 px-6 font-medium text-sage-900">₦{(idx + 1) * 120},500</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. FINANCIAL MODEL TAB VIEW */}
          {activeNavTab === "Financial model" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Financial model</h1>
                <p className="text-sm text-sage-600 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-[#9C5B34]" />
                  AI-built from your actuals and assumptions. Investor-grade structure, your numbers.
                </p>
              </div>

              {/* Sub-tabs and Export Button */}
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
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-300 rounded-card text-sm font-medium text-sage-700 hover:bg-sage-50 shadow-card transition-colors cursor-pointer active:scale-95 w-fit"
                >
                  <Download className="w-4 h-4 text-sage-500" />
                  <span>Export XLSX</span>
                </button>
              </div>

              {/* Tables Card */}
              <div className="bg-white rounded-modal border border-sage-200/90 shadow-card overflow-hidden">
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
            </div>
          )}

          {/* 7. INTEGRATIONS TAB VIEW */}
          {activeNavTab === "Integrations" && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl font-display font-semibold text-sage-900 mb-1">Integrations</h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {integrations.map((item) => {
                  const isConnected = item.status === "Connected";
                  return (
                    <div key={item.id} className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card flex flex-col justify-between space-y-6">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-card bg-sage-100 flex items-center justify-center font-bold text-sage-800 text-sm border border-sage-200/60 flex-shrink-0">
                          {item.initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sage-900 text-base">{item.name}</h3>
                          <p className="text-xs text-sage-500 mt-0.5">{item.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleConnection(item.id, item.name, item.status)}
                        className={`w-full py-2.5 px-4 rounded-card text-sm font-medium transition-all cursor-pointer flex items-center justify-center ${
                          isConnected
                            ? "bg-white text-[#a33b20] border border-sage-300 hover:bg-sage-50"
                            : "bg-[#9C5B34] text-white hover:bg-[#9C5B34]"
                        }`}
                      >
                        {isConnected ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
