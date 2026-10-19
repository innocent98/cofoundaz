'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check } from 'lucide-react';
import { ShellTopBar } from '@/components/shell-top-bar';
import type { ExperimentDraft } from '@/lib/api/validation';

type ValidationShell = {
  triggerToast: (msg: string) => void;
  /** An AI experiment draft waiting for the smoke-test builder to pick it up. */
  pendingDraft: ExperimentDraft | null;
  setPendingDraft: (draft: ExperimentDraft | null) => void;
};

const ShellContext = createContext<ValidationShell | undefined>(undefined);

export function useValidationShell() {
  const context = useContext(ShellContext);
  if (!context) throw new Error('useValidationShell must be used within the Validation layout');
  return context;
}

export function useToast() {
  const { triggerToast } = useValidationShell();
  return { triggerToast };
}

const TABS = [
  { label: 'Overview', path: '/validation' },
  { label: 'Smoke tests', path: '/validation/smoke-tests' },
  { label: 'Interview scripts', path: '/validation/scripts' },
  { label: 'Interviews', path: '/validation/interviews' },
  { label: 'Surveys', path: '/validation/surveys' },
  { label: 'Assumptions', path: '/validation/assumptions' },
  { label: 'MVP feedback', path: '/validation/mvp' },
];

export default function ValidationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<ExperimentDraft | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 4000);
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const value = useMemo(() => ({ triggerToast, pendingDraft, setPendingDraft }), [triggerToast, pendingDraft]);

  return (
    <ShellContext.Provider value={value}>
      <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F5] text-[#1E2923] min-h-screen">
        {toastMessage && (
          <div role="status" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] bg-[#12261C] text-white px-5 py-2.5 rounded-card shadow-raised flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
            <Check className="w-4 h-4 text-[#D89A6E] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="sticky top-0 z-40 bg-[#F7F7F5]">
          <ShellTopBar title="Validation Hub" />

          <nav aria-label="Validation sections" className="border-b border-[#EBEBE6] px-4 md:px-8 py-3 bg-[#F7F7F5]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const isActive = pathname === tab.path;
                return (
                  <Link
                    key={tab.path}
                    href={tab.path}
                    aria-current={isActive ? 'page' : undefined}
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
          </nav>
        </div>

        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">{children}</main>
      </div>
    </ShellContext.Provider>
  );
}
