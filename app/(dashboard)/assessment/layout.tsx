"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { ShellTopBar } from "@/components/shell-top-bar";
import { useWorkspace } from "@/components/workspace-context";
import { canTakeAssessment } from "@/lib/nav-access";

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useWorkspace();

  // If in runner mode, hide standard shell tabs
  const isRunner = pathname.includes('/assessment/run');

  // Team members read results; only founders take the check-in, so they get no In progress tab.
  const navItems = [
    { name: "Overview", path: "/assessment" },
    ...(canTakeAssessment(role) ? [{ name: "In progress", path: "/assessment/in-progress" }] : []),
    { name: "Past results", path: "/assessment/results" },
    { name: "Compare", path: "/assessment/compare" },
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-[#f5f7f5] text-[#2c3531] font-body w-full">
        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6] w-full">
          <ShellTopBar title="Startup Assessment" />

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
