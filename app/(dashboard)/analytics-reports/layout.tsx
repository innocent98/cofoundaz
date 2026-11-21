"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { ShellTopBar } from "@/components/shell-top-bar";
import { useAnalyticsAccess } from "./_components/access";

// Wave 1 (D-ANA-1): Overview, Reports (saved + builder) and Exports. Schedules, investor updates and
// board decks are waves 2-3 and are deliberately not linked here. The section stays out of the
// sidebar until the lead's re-walk (components/sidebar.tsx); every page opens by URL.
const TABS = [
  { name: "Overview", path: "/analytics-reports", overview: true, exports: false },
  { name: "Reports", path: "/analytics-reports/saved", overview: false, exports: false },
  { name: "Exports", path: "/analytics-reports/exports", overview: false, exports: true },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const access = useAnalyticsAccess();
  const tabs = TABS.filter((t) => (t.overview ? access.canOverview : t.exports ? access.canExport : true));

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-neutral-xf5f7f5 text-neutral-x2c3531 font-body w-full">
        <div className="sticky top-0 z-40 bg-surface-subtle border-b border-line-soft w-full">
          <ShellTopBar title="Analytics & Reports" />
          {!access.loading && tabs.length > 1 && (
            <nav
              aria-label="Analytics sections"
              className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-surface-subtle px-4 md:px-8 py-3"
            >
              {tabs.map((tab) => {
                const isActive =
                  tab.path === "/analytics-reports"
                    ? pathname === tab.path
                    : pathname.startsWith(tab.path) || (tab.path.endsWith("/saved") && pathname.startsWith("/analytics-reports/builder"));
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
          )}
        </div>

        <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full min-w-0 space-y-6 pb-20">{children}</main>
      </div>
    </ToastProvider>
  );
}
