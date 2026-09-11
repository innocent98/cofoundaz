"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { Bell, UserPlus } from "lucide-react";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Cash flow", path: "/finance" },
    { name: "Runway", path: "/finance/runway" },
    { name: "Budgets", path: "/finance/budgets" },
    { name: "Invoices", path: "/finance/invoices" },
    { name: "Expenses", path: "/finance/expenses" },
    { name: "Financial model", path: "/finance/model" },
    { name: "Integrations", path: "/finance/integrations" },
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-[#f5f7f5] text-[#2c3531] font-body w-full">
        
        {/* Outer Single Top Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-green-100 shadow-card w-full">
          <header className="flex w-full items-center justify-between gap-2 px-6 py-3 border-b border-green-100">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <button
                type="button"
                aria-label="Sidebar Menu"
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
          </header>

          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-white px-6 py-2">
            {navItems.map((tab) => {
              const isActive = pathname === tab.path || (tab.path !== "/finance" && pathname?.startsWith(tab.path));
              return (
                <button
                  key={tab.name}
                  onClick={() => router.push(tab.path)}
                  className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-copper-200 text-copper-700 shadow-card font-semibold"
                      : "bg-sage-100 text-sage-700 hover:bg-green-100"
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full space-y-6 pb-20">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
