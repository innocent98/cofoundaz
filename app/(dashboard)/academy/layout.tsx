"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./ToastContext";
import { ShellTopBar } from '@/components/shell-top-bar';

export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Recommended", path: "/academy" },
    { name: "Courses", path: "/academy/courses" },
    { name: "Learning Paths", path: "/academy/paths" },
    { name: "Articles", path: "/academy/articles" },
    { name: "Certificates", path: "/academy/certificates" },
  ];

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-full min-w-0 bg-[#f5f7f5] text-[#2c3531] font-body w-full">
        
        {/* Outer Single Top Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-sage-200/85 shadow-card w-full">
          <ShellTopBar title="Learning Academy" />

          <nav className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none bg-sage-50 px-6 py-2">
            {navItems.map((tab) => {
              const isActive = pathname === tab.path || (tab.path !== "/academy" && pathname?.startsWith(tab.path));
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center px-4 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-copper-200 text-copper-900 shadow-card font-semibold"
                      : "bg-sage-100 text-sage-700 hover:bg-sage-200"
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 flex-1 w-full space-y-6 pb-20">
          {children}
        </div>
      </div>
    </ToastProvider>
  );
}
