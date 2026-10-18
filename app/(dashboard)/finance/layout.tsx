"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { useSidebar } from '@/components/sidebar-context';
import { HealthPill } from '@/components/health-pill';
import { NotificationBell } from '@/components/notification-bell';

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openSidebar } = useSidebar();

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
                aria-label="Open menu"
                onClick={openSidebar}
                className="lg:hidden h-8 w-8 rounded-full bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-[11px] shadow-card hover:opacity-90 transition-opacity shrink-0"
              >
                C
              </button>

              <div className="flex min-w-0 items-center gap-1 text-sm text-sage-500">
                <Link href="/dashboard" className="truncate hover:text-sage-700 font-medium text-sm">Workspace</Link>
                <span className="text-sage-400">/</span>
                <span className="truncate font-bold text-[#1E2923] text-base">Finance Hub</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <HealthPill className="bg-green-100 text-green-900 px-2 py-1 rounded-full text-[10px] md:text-xs font-medium flex items-center gap-1 border border-green-200" />

              <NotificationBell />
            </div>
          </header>

          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-white px-6 py-2">
            {navItems.map((tab) => {
              const isActive = pathname === tab.path || (tab.path !== "/finance" && pathname?.startsWith(tab.path));
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-copper-200 text-copper-700 shadow-card font-semibold"
                      : "bg-sage-100 text-sage-700 hover:bg-green-100"
                  }`}
                >
                  {tab.name}
                </Link>
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
