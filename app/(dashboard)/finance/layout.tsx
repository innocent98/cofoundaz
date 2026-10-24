"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { ShellTopBar } from "@/components/shell-top-bar";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
        {/* Shared top bar (search, health, bell, invite) plus the section tabs */}
        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6] w-full">
          <ShellTopBar title="Finance Hub" />

          <nav
            aria-label="Finance sections"
            className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-[#F7F7F5] px-4 md:px-8 py-3"
          >
            {navItems.map((tab) => {
              const isActive = pathname === tab.path || (tab.path !== "/finance" && pathname?.startsWith(tab.path));
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-4 py-2 max-md:min-h-11 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#EAD5C6] text-[#1E2923] font-bold shadow-card"
                      : "bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]"
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full min-w-0 space-y-6 pb-20">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
