"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider, useToast } from "./ToastContext";
import { useAssessmentApi } from "@/hooks/useAssessmentApi";
import { Bell } from "lucide-react";

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // If in runner mode, hide standard shell tabs
  const isRunner = pathname.includes('/assessment/run');

  const { activeSession } = useAssessmentApi();

  const navItems = [
    { name: "Overview", path: "/assessment" },
    { name: "In progress", path: "/assessment/in-progress" },
    { name: "Past results", path: "/assessment/results" },
    { name: "Compare", path: "/assessment/compare" },
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-[#f5f7f5] text-[#2c3531] font-body w-full">
        {/* Outer Single Top Header */}
        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6] w-full">
          <header className="bg-white border-b border-[#EBEBE6] px-3 md:px-4 md:px-8 py-3.5 flex items-center justify-between gap-2 md:gap-4 w-full">
            <div className="flex min-w-0 items-center gap-2 md:gap-3">
              <div className="flex min-w-0 items-center gap-1.5 md:gap-2 text-xs md:text-sm md:text-base font-semibold">
                <span className="truncate text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="truncate text-[#1E2923] font-bold">Startup Assessment</h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="bg-[#E3EFE9] text-[#12291F] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 h-[34px]">
                <span>Health</span>
                <span className="font-bold">72</span>
                <span className="text-green-600 font-bold">↑</span>
              </div>

              <button
                aria-label="Notifications"
                className="relative w-9 h-9 rounded-full border border-[#DCE6E1] bg-white flex items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors"
              >
                <Bell className="w-4 h-4 text-[#66756F]" />
                <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  5
                </span>
              </button>

              <button className="shrink-0 whitespace-nowrap bg-[#A8894B] text-[#12291F] font-semibold text-xs px-4 h-[36px] rounded-[8px] hover:bg-[#967941] transition-colors">
                <span>+ Invite</span>
              </button>
            </div>
          </header>

          {!isRunner && (
            <div className="px-4 md:px-8 py-3 bg-[#F7F7F5] w-full">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {navItems.map((tab) => {
                  const isActive = pathname === tab.path;
                  return (
                    <button
                      key={tab.name}
                      onClick={() => router.push(tab.path)}
                      className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-[#EAD5C6] text-[#1E2923] font-bold shadow-card"
                          : "bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]"
                      }`}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <main className="max-w-4xl mx-auto px-4 md:px-6 pt-12 flex-1 w-full space-y-6 pb-20">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
