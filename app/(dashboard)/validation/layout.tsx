'use client';

import React, { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/sidebar';
import { useValidationApi } from '@/hooks/useValidationApi';

type ToastContextType = {
  triggerToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export default function ValidationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [toast, setToast] = useState({ show: false, message: '' });

  const triggerToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const tabs = [
    { label: 'Overview', path: '/validation' },
    { label: 'Smoke tests', path: '/validation/smoke-tests' },
    { label: 'Interview scripts', path: '/validation/scripts' },
    { label: 'Interviews', path: '/validation/interviews' },
    { label: 'Surveys', path: '/validation/surveys' },
    { label: 'Assumptions', path: '/validation/assumptions' },
    { label: 'MVP feedback', path: '/validation/mvp' },
  ];

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      <div className="relative flex min-h-screen w-full min-w-0 flex-col bg-[#f5f7f5] text-[#2c3531] font-body">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 block bg-black/40 backdrop-blur-[1px] lg:hidden"
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {/* GLOBAL TOAST NOTIFICATION */}
          {toast.show && (
            <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-bounce">
              <div className="bg-[#0e271f] text-white px-5 py-2.5 rounded-card shadow-raised flex items-center gap-3 border border-[#1f4236]">
                <div className="flex items-center justify-center text-green-400 font-bold text-sm">
                  ✓
                </div>
                <span className="font-medium text-sm tracking-wide text-sage-100">
                  {toast.message}
                </span>
              </div>
            </div>
          )}

          <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6]">
            <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                  onClick={() => setIsSidebarOpen((open) => !open)}
                  className="lg:hidden h-10 w-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
                >
                  C
                </button>
                <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
                  <span className="text-[#8E9B90]">Workspace</span>
                  <span className="text-[#8E9B90]">/</span>
                  <h1 className="text-[#1E2923] font-bold">Validation Hub</h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 md:gap-3">
                <div className="hidden md:flex items-center gap-2 bg-[#E6EFEA] text-[#183B28] px-3.5 py-1.5 rounded-full text-xs font-medium">
                  <span className="text-[#556358]">Health</span>
                  <span className="font-bold text-sm">72</span>
                  <span className="text-[10px] text-[#2D5A3F]">↑</span>
                </div>

                <button
                  aria-label="Notifications"
                  className="relative shrink-0 p-2.5 bg-[#F5F5F0] hover:bg-[#EBEBE6] rounded-full transition-colors text-[#1E2923]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    5
                  </span>
                </button>

                <button className="shrink-0 flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-3 py-1.5 rounded-card text-xs md:text-sm transition-colors shadow-card">
                  <span>+ Invite</span>
                </button>
              </div>
            </header>

            <div className="px-4 md:px-8 py-3 bg-[#F7F7F5]">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.path;
                  return (
                    <Link
                      key={tab.path}
                      href={tab.path}
                      className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all block ${
                        isActive
                          ? "bg-[#EAD5C6] text-[#1E2923] font-bold shadow-card"
                          : "bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
            {children}
          </main>
        </div>
      </div>
    </ToastContext.Provider>
  );
}
