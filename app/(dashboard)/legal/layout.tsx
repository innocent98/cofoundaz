"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { ShellTopBar } from '@/components/shell-top-bar';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Formation", path: "/legal" },
    { name: "Templates", path: "/legal/templates" },
    { name: "Contract review", path: "/legal/review" },
    { name: "IP tracker", path: "/legal/ip" },
    { name: "Compliance", path: "/legal/compliance" },
    { name: "Advisor requests", path: "/legal/requests" },
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-[#f5f7f5] text-[#2c3531] font-body w-full">
        
        {/* Outer Single Top Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-sage-200/85 shadow-card w-full">
          <ShellTopBar title="Legal &amp; Compliance" />

          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-white px-6 py-2">
            {navItems.map((tab) => {
              const isActive = pathname === tab.path || (tab.path !== "/legal" && pathname?.startsWith(tab.path));
              return (
                <button
                  key={tab.name}
                  onClick={() => router.push(tab.path)}
                  className={`px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[11px] md:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#EAD5C6] text-[#2c220b] shadow-card font-semibold"
                      : "bg-[#eaeee9] text-sage-700 hover:bg-[#e0e6df]"
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
