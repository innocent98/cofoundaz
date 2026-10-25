"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { ShellTopBar } from '@/components/shell-top-bar';

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
      <div className="flex flex-col min-h-full min-w-0 bg-neutral-xf5f7f5 text-neutral-x2c3531 font-body w-full">
        
        {/* Outer Single Top Header */}
        <div className="sticky top-0 z-40 bg-surface-subtle border-b border-line-soft w-full">
          <ShellTopBar title="Sales Hub" />

          <div className="px-4 md:px-8 py-3 bg-surface-subtle w-full">
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {navItems.map((tab) => {
                const isActive = pathname === tab.path || (tab.path !== "/sales" && pathname.startsWith(tab.path));
                return (
                  <button
                    key={tab.name}
                    onClick={() => router.push(tab.path)}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-accent-200 text-ink font-bold shadow-card"
                        : "bg-white border border-line-soft text-ink-muted hover:border-neutral-xc5cfc7"
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full min-w-0 space-y-6 pb-20">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
