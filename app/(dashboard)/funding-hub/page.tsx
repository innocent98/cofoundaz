"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar";
import { 
  Bell, 
  UserPlus, 
  Check, 
  ChevronRight,
  X,
  Sparkles
} from "lucide-react";

type FundingTab =
  | "Pipeline"
  | "Data room"
  | "Cap table"
  | "Grants"
  | "Term sheets"
  | "Analytics";

interface InvestorCard {
  id: string;
  name: string;
  amount: string;
  status: string;
  statusType: "Cold" | "Warm" | "Hot";
  action: string;
}

interface PipelineColumn {
  id: string;
  title: string;
  investors: InvestorCard[];
}

interface DataRoomFolder {
  id: string;
  name: string;
  filesCount: number;
}

interface AccessLogItem {
  id: string;
  initials: string;
  name: string;
  action: string;
  time: string;
}

interface CapTableRow {
  id: string;
  stakeholder: string;
  security: string;
  ownership: string;
}

interface GrantItem {
  id: string;
  fit: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
}

interface TermSheetComparisonRow {
  term: string;
  sheetA: string;
  sheetB: string;
}

export default function FundingHubApp() {
  const [activeTab, setActiveTab] = useState<FundingTab>("Analytics");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Share Data Room Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [investorEmail, setInvestorEmail] = useState<string>("");
  const [selectedFolders, setSelectedFolders] = useState<{ [key: string]: boolean }>({
    Corporate: true,
    Financials: true,
    Product: true,
    Team: true,
  });
  const [watermark, setWatermark] = useState<boolean>(true);

  // Cap Table Model Inputs State
  const [newMoney, setNewMoney] = useState<string>("90");
  const [preMoney, setPreMoney] = useState<string>("360");

  // Grants State
  const [grants, setGrants] = useState<GrantItem[]>([
    {
      id: "grant-1",
      fit: "92%",
      title: "Digital Inclusion Fund",
      provider: "GIZ",
      amount: "₦5M",
      deadline: "closes Aug 30"
    },
    {
      id: "grant-2",
      fit: "84%",
      title: "Fintech for Good grant",
      provider: "MasterCard Foundation",
      amount: "₦8M",
      deadline: "closes Sep 15"
    },
    {
      id: "grant-3",
      fit: "71%",
      title: "Youth Startup Grant",
      provider: "Bank of Industry",
      amount: "₦3M",
      deadline: "closes Oct 1"
    }
  ]);

  // Pipeline columns & cards data
  const [pipelineColumns] = useState<PipelineColumn[]>([
    {
      id: "research",
      title: "Research",
      investors: [
        {
          id: "nordic-seed",
          name: "Nordic Seed",
          amount: "$200k",
          status: "Cold",
          statusType: "Cold",
          action: "Find intro"
        }
      ]
    },
    {
      id: "outreach",
      title: "Outreach",
      investors: [
        {
          id: "greenlight-vc",
          name: "GreenLight VC",
          amount: "$100k",
          status: "Cold",
          statusType: "Cold",
          action: "Send deck"
        }
      ]
    },
    {
      id: "meeting",
      title: "Meeting",
      investors: [
        {
          id: "sahel-fund",
          name: "Sahel Fund",
          amount: "$150k",
          status: "Warm",
          statusType: "Warm",
          action: "Partner call Tue"
        }
      ]
    },
    {
      id: "diligence",
      title: "Diligence",
      investors: [
        {
          id: "adial-holdings",
          name: "Adia Holdings",
          amount: "$50k angel",
          status: "Warm",
          statusType: "Warm",
          action: "Send data room"
        }
      ]
    },
    {
      id: "term-sheet",
      title: "Term Sheet",
      investors: [
        {
          id: "ventures-africa",
          name: "Ventures for Africa",
          amount: "$100k to $250k",
          status: "Warm",
          statusType: "Warm",
          action: "Review terms"
        }
      ]
    }
  ]);

  const dataRoomFolders: DataRoomFolder[] = [
    { id: "corporate", name: "Corporate", filesCount: 6 },
    { id: "financials", name: "Financials", filesCount: 4 },
    { id: "product", name: "Product", filesCount: 8 },
    { id: "market", name: "Market", filesCount: 3 },
    { id: "team", name: "Team", filesCount: 5 },
    { id: "legal", name: "Legal", filesCount: 7 },
  ];

  const accessLogs: AccessLogItem[] = [
    { id: "log-1", initials: "SF", name: "Sahel Fund", action: "viewed Financial model", time: "Today 10:12 · 6 min" },
    { id: "log-2", initials: "VA", name: "Ventures for Africa", action: "viewed Pitch deck", time: "Yesterday · 4 min" },
    { id: "log-3", initials: "AH", name: "Adia Holdings", action: "viewed Cap table", time: "2d ago · 2 min" },
  ];

  const capTableRows: CapTableRow[] = [
    { id: "cap-1", stakeholder: "Amara Okafor", security: "Common", ownership: "45%" },
    { id: "cap-2", stakeholder: "Daniel Kariuki", security: "Common", ownership: "25%" },
    { id: "cap-3", stakeholder: "Option pool", security: "Options", ownership: "18%" },
    { id: "cap-4", stakeholder: "Kola Angels", security: "SAFE", ownership: "12%" },
  ];

  const termSheetRows: TermSheetComparisonRow[] = [
    { term: "Valuation (pre)", sheetA: "₦360M", sheetB: "₦320M" },
    { term: "Amount", sheetA: "₦90M", sheetB: "₦80M" },
    { term: "Option pool", sheetA: "10%", sheetB: "15%" },
    { term: "Liquidation pref", sheetA: "1x non-part.", sheetB: "2x participating" },
    { term: "Board seats", sheetA: "1 investor", sheetB: "2 investor" },
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCardClick = (investorName: string) => {
    triggerToast(`Meeting-prep brief ready for ${investorName}.`);
  };

  const handleShareDataRoomClick = () => {
    setIsShareModalOpen(true);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setIsShareModalOpen(false);
    triggerToast("Data room shared. Invite sent.");
  };

  const handleSaveScenario = () => {
    triggerToast("Round scenario saved.");
  };

  const handleStartApplication = (grantTitle: string) => {
    triggerToast(`Drafting your ${grantTitle} application with AI.`);
  };

  const handleNotRelevant = (grantId: string, grantTitle: string) => {
    setGrants(prev => prev.filter(g => g.id !== grantId));
    triggerToast(`Dismissed ${grantTitle}.`);
  };

  const toggleFolderCheckbox = (folderName: string) => {
    setSelectedFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#2c3531] flex font-sans relative">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0e271f] text-white flex-shrink-0 hidden md:block shadow-lg">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 w-full md:pl-64">
        
        {/* STICKY HEADER */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200/85 shadow-xs w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="hover:text-gray-700 cursor-pointer">Workspace</span>
              <span>/</span>
              <span className="font-semibold text-gray-900">Funding Hub</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <div className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1.5 border border-[#d2e2d8]">
                <span>Health</span>
                <span className="font-serif font-bold text-sm sm:text-base text-[#0e271f]">72</span>
                <span className="text-xs">↑</span>
              </div>

              <button
                aria-label="Notifications"
                className="relative p-2.5 rounded-full bg-gray-100/80 border border-gray-200/60 text-gray-700 hover:bg-gray-200/60 transition-colors flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#b89d5f] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm transition-colors flex items-center gap-1 cursor-pointer">
                <UserPlus className="w-4 h-4" />
                <span>+ Invite</span>
              </button>
            </div>
          </div>

          {/* TOP NAV TABS */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1">
            <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              {(
                [
                  "Pipeline",
                  "Data room",
                  "Cap table",
                  "Grants",
                  "Term sheets",
                  "Analytics",
                ] as FundingTab[]
              ).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? "bg-[#eadaaf] text-[#2c220b] shadow-2xs font-semibold"
                        : "bg-[#eaeee9] text-gray-700 hover:bg-[#e0e6df]"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* TOAST NOTIFICATION POPUP */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#0e271f] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#23483b] animate-bounce">
            <div className="w-5 h-5 rounded-full bg-[#1e4836] flex items-center justify-center text-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* SHARE DATA ROOM MODAL */}
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-lg overflow-hidden p-6 sm:p-8 space-y-6 relative">
              
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-semibold text-gray-900">Share data room</h2>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSendInvite} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Investor email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="partner@fund.com"
                    value={investorEmail}
                    onChange={(e) => setInvestorEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0e271f]/20"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                    Folders to share
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {Object.keys(selectedFolders).map((folderName) => {
                      const isChecked = selectedFolders[folderName];
                      return (
                        <button
                          key={folderName}
                          type="button"
                          onClick={() => toggleFolderCheckbox(folderName)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-colors cursor-pointer ${
                            isChecked 
                              ? "bg-[#e2ede6] text-[#1e4836] border-[#c2d7cb]" 
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded flex items-center justify-center ${isChecked ? "bg-[#1e4836] text-white" : "border border-gray-300 bg-white"}`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{folderName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleFolderCheckbox("Legal")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-colors cursor-pointer ${
                      selectedFolders["Legal"] 
                        ? "bg-[#e2ede6] text-[#1e4836] border-[#c2d7cb]" 
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${selectedFolders["Legal"] ? "bg-[#1e4836] text-white" : "border border-gray-300 bg-white"}`}>
                      {selectedFolders["Legal"] && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>Legal</span>
                  </button>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setWatermark(!watermark)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer border ${watermark ? "bg-[#1e4836] text-white border-[#1e4836]" : "border-gray-300 bg-white"}`}
                  >
                    {watermark && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <span className="text-sm text-gray-700 select-none cursor-pointer" onClick={() => setWatermark(!watermark)}>
                    Watermark PDFs with viewer's email
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold py-3.5 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center shadow-xs"
                  >
                    Send invite
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* MAIN BODY VIEW ROUTER */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex-1 w-full space-y-6">
          
          {activeTab === "Pipeline" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs max-w-lg space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span>Soft-committed vs target round</span>
                  <span className="text-gray-900 font-bold">₦58M of ₦90M</span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div className="bg-[#1e4836] h-full rounded-full w-[64%]"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
                {pipelineColumns.map((col) => (
                  <div key={col.id} className="bg-[#f0f3f0] rounded-2xl p-3 border border-gray-200/60 space-y-3 min-w-[220px]">
                    <div className="px-1 pt-1">
                      <h3 className="font-semibold text-sm text-gray-900">{col.title}</h3>
                      <p className="text-[11px] text-gray-500">{col.investors.length} investors</p>
                    </div>

                    <div className="space-y-3">
                      {col.investors.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => handleCardClick(inv.name)}
                          className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-2xs hover:border-[#b89d5f] transition-all cursor-pointer space-y-3 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm text-gray-900 group-hover:text-[#8c6d33] transition-colors">
                              {inv.name}
                            </h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              inv.statusType === "Cold" 
                                ? "bg-gray-100 text-gray-600" 
                                : "bg-[#e2ede6] text-[#1e4836]"
                            }`}>
                              {inv.status}
                            </span>
                          </div>

                          <div>
                            <p className="text-sm font-bold text-gray-900">{inv.amount}</p>
                            <p className="text-xs text-gray-500 mt-1">{inv.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-500 italic pt-2">
                Tip: click an investor card to get a meeting-prep brief from the Fundraising Copilot.
              </p>
            </div>
          )}

          {activeTab === "Data room" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-serif font-semibold text-gray-900">Data room</h1>
                <button
                  onClick={handleShareDataRoomClick}
                  className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>Share data room</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/95 shadow-2xs p-2 divide-y divide-gray-100">
                  {dataRoomFolders.map((folder) => (
                    <div 
                      key={folder.id}
                      onClick={() => triggerToast(`Opening folder: ${folder.name}`)}
                      className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors rounded-xl cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        <ChevronRight className="w-4 h-4 text-[#b89d5f] shrink-0" />
                        <span className="font-semibold text-sm text-gray-900">{folder.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{folder.filesCount} files</span>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200/95 shadow-2xs p-6 space-y-4">
                  <h3 className="font-semibold text-sm text-gray-900">Access log</h3>
                  <div className="space-y-4 divide-y divide-gray-100">
                    {accessLogs.map((log) => (
                      <div key={log.id} className="pt-4 first:pt-0 flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-[#0e271f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {log.initials}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            <span className="font-semibold">{log.name}</span> {log.action}
                          </p>
                          <p className="text-xs text-gray-500">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Cap table" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200/95 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-4 px-6">Stakeholder</th>
                          <th className="py-4 px-6">Security</th>
                          <th className="py-4 px-6 text-right">Ownership</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {capTableRows.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-sm text-gray-900">{row.stakeholder}</td>
                            <td className="py-4 px-6 text-sm text-gray-500">{row.security}</td>
                            <td className="py-4 px-6 text-sm font-bold text-gray-900 text-right">{row.ownership}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-200/95 shadow-2xs p-6 flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#1e4836]"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          strokeDasharray="70 30"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#8c6d33]"
                          strokeWidth="4"
                          stroke="currentColor"
                          fill="none"
                          strokeDasharray="18 82"
                          strokeDashoffset="-70"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-[#a2c2b0]"
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
                    <p className="text-xs text-gray-600 font-medium text-center">
                      Founders 70% · Options 18% · SAFE 12%
                    </p>
                  </div>

                  <div className="bg-[#0e271f] rounded-2xl p-6 text-white space-y-4 shadow-xl">
                    <h3 className="font-serif font-semibold text-base">Model a round</h3>
                    
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                        New money (₦M)
                      </label>
                      <input
                        type="text"
                        value={newMoney}
                        onChange={(e) => setNewMoney(e.target.value)}
                        className="w-full bg-[#16382c] border border-[#235342] rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#b89d5f]/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                        Pre-money (₦M)
                      </label>
                      <input
                        type="text"
                        value={preMoney}
                        onChange={(e) => setPreMoney(e.target.value)}
                        className="w-full bg-[#16382c] border border-[#235342] rounded-xl px-4 py-2.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#b89d5f]/50"
                      />
                    </div>

                    <div className="bg-[#16382c] border border-[#235342] rounded-xl p-3.5 text-xs text-gray-200">
                      You would go from <span className="font-bold text-white">70%</span> to <span className="font-bold text-[#eadaaf]">56%</span> founder ownership.
                    </div>

                    <button
                      onClick={handleSaveScenario}
                      className="w-full bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer text-center shadow-xs"
                    >
                      Save as scenario
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Grants" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <h1 className="text-3xl font-serif font-semibold text-gray-900">Grants</h1>
              
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">AI MATCHES</h3>

                <div className="space-y-4">
                  {grants.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                      No grant matches available right now.
                    </div>
                  ) : (
                    grants.map((grant) => (
                      <div 
                        key={grant.id}
                        className="bg-white rounded-2xl border border-gray-200/95 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-5">
                          <div className="bg-[#e2ede6] text-[#1e4836] px-3.5 py-2.5 rounded-xl font-serif font-bold text-center shrink-0 min-w-[70px]">
                            <div className="text-base sm:text-lg leading-tight">{grant.fit}</div>
                            <div className="text-[10px] uppercase font-sans tracking-wider opacity-80">FIT</div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-semibold text-base text-gray-900">{grant.title}</h4>
                            <p className="text-xs text-gray-500 font-medium">
                              {grant.provider} · {grant.amount} · {grant.deadline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleStartApplication(grant.title)}
                            className="bg-[#b89d5f] hover:bg-[#a68c4f] text-[#1c180e] font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-xs flex-1 sm:flex-none text-center"
                          >
                            Start application
                          </button>
                          <button
                            onClick={() => handleNotRelevant(grant.id, grant.title)}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer flex-1 sm:flex-none text-center shadow-2xs"
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
          )}

          {activeTab === "Term sheets" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="space-y-1">
                <h1 className="text-3xl font-serif font-semibold text-gray-900">Term sheets</h1>
                <p className="text-sm text-gray-500">Negotiate with clarity.</p>
              </div>

              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200/95 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-4 px-6">Term</th>
                          <th className="py-4 px-6">Sheet A</th>
                          <th className="py-4 px-6">Sheet B</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {termSheetRows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-sm text-gray-900">{row.term}</td>
                            <td className="py-4 px-6 text-sm text-gray-700 font-medium">{row.sheetA}</td>
                            <td className="py-4 px-6 text-sm text-gray-700 font-medium">{row.sheetB}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-[#f3eee2] border border-[#e5dcbe] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                  <div className="text-[#8c6d33] mt-0.5 shrink-0">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[#5c4720]">
                      AI note: <span className="font-normal text-gray-800">Sheet B's 2x liquidation preference is unusual at this stage. Ask for 1x non-participating.</span>
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-gray-400 italic">
                  This is AI-assisted guidance, not professional legal advice. For anything non-standard, involve a licensed professional.
                </p>
              </div>
            </div>
          )}

          {activeTab === "Analytics" && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <h1 className="text-3xl font-serif font-semibold text-gray-900">Fundraise analytics</h1>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Investor Funnel Card */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/95 shadow-2xs p-6 space-y-6">
                  <h3 className="font-semibold text-sm text-gray-900">Investor funnel</h3>

                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-gray-700">
                        <span>Contacted</span>
                        <span className="font-bold text-gray-900">24</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-full"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-gray-700">
                        <span>Meetings</span>
                        <span className="font-bold text-gray-900">11</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-[46%]"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-gray-700">
                        <span>Diligence</span>
                        <span className="font-bold text-gray-900">5</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-[21%]"></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-medium text-gray-700">
                        <span>Committed</span>
                        <span className="font-bold text-gray-900">2</span>
                      </div>
                      <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                        <div className="bg-[#1e4836] h-full rounded-full w-[8%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Committed vs Target Card */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200/95 shadow-2xs p-6 space-y-8 flex flex-col justify-between min-h-[300px]">
                  <h3 className="font-semibold text-sm text-gray-900">Committed vs target</h3>

                  <div className="flex flex-col items-center justify-center space-y-2 py-4">
                    <span className="font-serif font-bold text-5xl text-[#1e4836] tracking-tight">64%</span>
                    <span className="text-xs text-gray-500 font-medium">₦58M soft-committed of ₦90M</span>
                  </div>

                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden">
                    <div className="bg-[#1e4836] h-full rounded-full w-[64%]"></div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}