'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import { ShellTopBar } from '@/components/shell-top-bar';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';

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
  const pathname = usePathname();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { suggestMode } = useBuilderAccess();

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

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
      <div className="flex-1 flex flex-col min-w-0 bg-surface-subtle text-ink min-h-screen">
        {/* Toast Notification */}
        {toastMessage && (
          <div role="status" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-brand-rail-ink text-white px-5 py-2.5 rounded-card shadow-raised flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            <Check className="w-4 h-4 text-accent-500" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="sticky top-0 z-40 bg-surface-subtle">
          <ShellTopBar title="Business Builder" />

          {/* BC Suggest Mode Banner (business_consultant only) */}
          {suggestMode && (
            <div role="status" className="bg-accent-xfdf4e3 border-b border-accent-200 px-4 md:px-8 py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-accent-700">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
              <span>You&apos;re in suggest mode. The founder approves your edits.</span>
            </div>
          )}

          {/* Module Nav Tabs */}
          <nav aria-label="Business Builder sections" className="border-b border-line-soft px-4 md:px-8 py-3 bg-surface-subtle">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                  <Link
                    key={tab.label}
                    href={tab.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all block ${
                      isActive
                        ? 'bg-accent-200 text-ink font-bold shadow-card'
                        : 'bg-white border border-line-soft text-ink-muted hover:border-neutral-xc5cfc7'
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Dynamic Content */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
          {children}
        </main>
      </div>
    </ToastContext.Provider>
  );
}
