"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import {  } from 'lucide-react';
import { HealthPill } from '@/components/health-pill';
import { NotificationBell } from '@/components/notification-bell';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Pipeline", path: "/sales" },
    { name: "Leads", path: "/sales/leads" },
    { name: "Accounts", path: "/sales/accounts" },
    { name: "Sequences", path: "/sales/sequences" },
    { name: "AI Coach", path: "/sales/coach" },
    { name: "Analytics", path: "/sales/analytics" },
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-[#f5f7f5] text-[#2c3531] font-body w-full">
        
        {/* Outer Single Top Header */}
        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6] w-full">
          <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
                <span className="text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="text-[#1E2923] font-bold">Sales Hub</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <HealthPill className="hidden md:flex items-center gap-2 bg-[#E6EFEA] text-[#183B28] px-3.5 py-1.5 rounded-full text-xs font-medium" />

              <NotificationBell />

              <button className="shrink-0 flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-3 py-1.5 rounded-card text-xs md:text-sm transition-colors shadow-card">
                <span>+ Invite</span>
              </button>
            </div>
          </header>

          <div className="px-4 md:px-8 py-3 bg-[#F7F7F5] w-full">
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {navItems.map((tab) => {
                const isActive = pathname === tab.path || (tab.path !== "/sales" && pathname.startsWith(tab.path));
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
            </nav>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full space-y-6 pb-20">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
