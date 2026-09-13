"use client";

import React, { useState } from "react";
import { useToast } from "../ToastContext";
import { ChevronRight, X, Check } from "lucide-react";

export default function DataRoomPage() {
  const { triggerToast } = useToast();

  const dataRoomFolders = [
    { id: "corporate", name: "Corporate", filesCount: 6 },
    { id: "financials", name: "Financials", filesCount: 4 },
    { id: "product", name: "Product", filesCount: 8 },
    { id: "market", name: "Market", filesCount: 3 },
    { id: "team", name: "Team", filesCount: 5 },
    { id: "legal", name: "Legal", filesCount: 7 },
  ];

  const accessLogs = [
    { id: "log-1", initials: "SF", name: "Sahel Fund", action: "viewed Financial model", time: "Today 10:12 · 6 min" },
    { id: "log-2", initials: "VA", name: "Ventures for Africa", action: "viewed Pitch deck", time: "Yesterday · 4 min" },
    { id: "log-3", initials: "AH", name: "Adia Holdings", action: "viewed Cap table", time: "2d ago · 2 min" },
  ];

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [investorEmail, setInvestorEmail] = useState("");
  const [selectedFolders, setSelectedFolders] = useState<{ [key: string]: boolean }>({
    Corporate: true,
    Financials: true,
    Product: true,
    Team: true,
    Market: false,
    Legal: false,
  });
  const [watermark, setWatermark] = useState(true);

  const toggleFolderCheckbox = (folderName: string) => {
    setSelectedFolders((prev) => ({
      ...prev,
      [folderName]: !prev[folderName],
    }));
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setIsShareModalOpen(false);
    triggerToast("Data room shared. Invite sent.");
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Data room</h1>
        <button
          onClick={() => setIsShareModalOpen(true)}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-4 py-2.5 rounded-card text-sm transition-colors cursor-pointer flex items-center gap-1 shadow-card"
        >
          <span>Share data room</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-modal border border-sage-200/95 shadow-card p-2 divide-y divide-sage-100">
          {dataRoomFolders.map((folder) => (
            <div 
              key={folder.id}
              onClick={() => triggerToast(`Opening folder: ${folder.name}`)}
              className="px-5 py-4 flex items-center justify-between hover:bg-sage-50/80 transition-colors rounded-card cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <ChevronRight className="w-4 h-4 text-[#9C5B34] shrink-0" />
                <span className="font-semibold text-sm text-sage-900">{folder.name}</span>
              </div>
              <span className="text-xs text-sage-500 font-medium">{folder.filesCount} files</span>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white rounded-modal border border-sage-200/95 shadow-card p-6 space-y-4">
          <h3 className="font-semibold text-sm text-sage-900">Access log</h3>
          <div className="space-y-4 divide-y divide-sage-100">
            {accessLogs.map((log) => (
              <div key={log.id} className="pt-4 first:pt-0 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#0e271f] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-card">
                  {log.initials}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium text-sage-900 truncate">
                    <span className="font-semibold">{log.name}</span> {log.action}
                  </p>
                  <p className="text-xs text-sage-500">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] border border-sage-200 shadow-raised w-full max-w-lg overflow-hidden p-6 md:p-8 space-y-6 relative">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold text-sage-900">Share data room</h2>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 rounded-full hover:bg-sage-100 text-sage-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-sage-500">
                  Investor email
                </label>
                <input
                  type="email"
                  required
                  placeholder="partner@fund.com"
                  value={investorEmail}
                  onChange={(e) => setInvestorEmail(e.target.value)}
                  className="w-full bg-sage-50 border border-sage-200 rounded-input px-4 py-3 text-sm text-sage-900 focus:outline-none focus:border-[#1e4836] transition-colors"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-sage-500">
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
                        className={`px-3.5 py-2 rounded-card text-xs font-medium flex items-center gap-2 border transition-colors cursor-pointer ${
                          isChecked 
                            ? "bg-[#e2ede6] text-[#1e4836] border-[#c2d7cb]" 
                            : "bg-sage-50 text-sage-600 border-sage-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded flex items-center justify-center ${isChecked ? "bg-[#1e4836] text-white" : "border border-sage-300 bg-white"}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{folderName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setWatermark(!watermark)}
                  className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer border ${watermark ? "bg-[#1e4836] text-white border-[#1e4836]" : "border-sage-300 bg-white"}`}
                >
                  {watermark && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span className="text-sm text-sage-700 select-none cursor-pointer" onClick={() => setWatermark(!watermark)}>
                  Watermark PDFs with viewer&apos;s email
                </span>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 bg-white hover:bg-sage-50 text-sage-800 border border-sage-300 font-semibold py-3.5 px-4 rounded-card text-sm transition-colors cursor-pointer text-center shadow-card"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold py-3.5 px-4 rounded-card text-sm transition-colors cursor-pointer text-center shadow-card"
                >
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
