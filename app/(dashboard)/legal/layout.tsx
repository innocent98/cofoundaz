"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { ShellTopBar } from "@/components/shell-top-bar";

// Templates, Contract review and Advisor requests (slices 2 and 3 of the module) have no API
// yet, so they are not in the tabs and their routes redirect here. See docs/checklist/legal-prd-gaps.md.
const NAV_ITEMS = [
  { name: "Formation", path: "/legal" },
  { name: "IP tracker", path: "/legal/ip" },
  { name: "Compliance", path: "/legal/compliance" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-neutral-xf5f7f5 text-neutral-x2c3531 font-body w-full">
        <div className="sticky top-0 z-40 bg-surface-subtle border-b border-line-soft w-full">
          <ShellTopBar title="Legal & Compliance" />

          <nav
            aria-label="Legal sections"
            className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-surface-subtle px-4 md:px-8 py-3"
          >
            {NAV_ITEMS.map((tab) => {
              const isActive = pathname === tab.path || (tab.path !== "/legal" && pathname?.startsWith(tab.path));
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-4 py-2 max-md:min-h-11 inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-accent-200 text-ink font-bold shadow-card"
                      : "bg-white border border-line-soft text-ink-muted hover:border-neutral-xc5cfc7"
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full min-w-0 space-y-6 pb-20">{children}</main>
      </div>
    </ToastProvider>
  );
}
