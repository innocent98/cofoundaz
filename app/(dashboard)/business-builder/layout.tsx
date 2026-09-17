'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBusinessBuilderApi } from '@/hooks/useBusinessBuilderApi';
import { Bell, Plus, Check } from 'lucide-react';
import { useSidebar } from '@/components/sidebar-context';
import { useHealthScore } from '@/hooks/useHealthScore';

type ToastContextType = {
  triggerToast: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export default function BusinessBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { openSidebar } = useSidebar();
  const pathname = usePathname();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { userRole } = useBusinessBuilderApi();
  const { data: health, loading: healthLoading } = useHealthScore();
  const showHealth = !healthLoading && health.status === 'ok';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const tabs = [
    { label: 'Overview', path: '/business-builder' },
    { label: 'Business Model', path: '/business-builder/business-model-canvas' },
    { label: 'Lean Canvas', path: '/business-builder/lean-canvas' },
    { label: 'Mission & Vision', path: '/business-builder/mission-vision' },
    { label: 'Value Prop', path: '/business-builder/value-proposition' },
    { label: 'Personas', path: '/business-builder/personas' },
    { label: 'Pricing', path: '/business-builder/pricing' },
    { label: 'Revenue', path: '/business-builder/revenue-model' },
    { label: 'Competitive', path: '/business-builder/competitive-analysis' },
    { label: 'SWOT', path: '/business-builder/swot' },
    { label: 'Business Plan', path: '/business-builder/plan' },
  ];

  return (
    <ToastContext.Provider value={{ triggerToast }}>
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#12261C] text-white px-5 py-2.5 rounded-card shadow-raised flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            <Check className="w-4 h-4 text-[#D89A6E]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* BC Suggest Mode Banner */}
        {userRole === 'BC' && (
          <div className="bg-[#FDF4E3] border-b border-[#EAD5C6] px-4 md:px-8 py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-[#8A5330]">
            <span className="w-2 h-2 rounded-full bg-[#D89A6E] animate-pulse" />
            <span>You&apos;re in suggest mode. The founder approves your edits.</span>
          </div>
        )}

        <div className="sticky top-0 z-40 bg-[#F7F7F5] border-b border-[#EBEBE6]">
          <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={openSidebar}
                className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card"
              >
                C
              </button>
              <div className="flex items-center gap-2 text-sm md:text-base font-semibold">
                <span className="text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="text-[#1E2923] font-bold">Business Builder</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showHealth && (
                <div className="hidden md:flex items-center gap-2 bg-[#E6EFEA] text-[#183B28] px-3.5 py-1.5 rounded-full text-xs font-medium">
                  <span className="text-[#556358]">Health</span>
                  <span className="font-bold text-sm">{health.score}</span>
                  {health.weeklyDelta !== 0 && (
                    <span className={`text-[10px] ${health.weeklyDelta > 0 ? 'text-[#2D5A3F]' : 'text-[#B0483B]'}`}>
                      {health.weeklyDelta > 0 ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              )}

              <button className="relative p-2.5 bg-[#F5F5F0] hover:bg-[#EBEBE6] rounded-full transition-colors text-[#1E2923]">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-4 py-2 rounded-card text-xs transition-colors shadow-card">
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Invite</span>
              </button>
            </div>
          </header>

          {/* Module Nav Tabs */}
          <div className="px-4 md:px-8 py-3 bg-[#F7F7F5]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {tabs.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                  <Link
                    key={tab.label}
                    href={tab.path}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all block ${
                      isActive
                        ? 'bg-[#EAD5C6] text-[#1E2923] font-bold shadow-card'
                        : 'bg-white border border-[#EBEBE6] text-[#617065] hover:border-[#C5CFC7]'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
          {children}
        </main>
      </div>
    </ToastContext.Provider>
  );
}
