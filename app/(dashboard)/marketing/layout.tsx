'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellTopBar } from '@/components/shell-top-bar';
import { ToastProvider, useToast } from './ToastContext';

const tabs = [
  { name: 'Overview', path: '/marketing' },
  { name: 'Calendar', path: '/marketing/calendar' },
  { name: 'Campaigns', path: '/marketing/campaigns' },
  { name: 'AI Copy', path: '/marketing/copy' },
  { name: 'Channels', path: '/marketing/channels' },
  { name: 'SEO', path: '/marketing/seo' },
  { name: 'Segments', path: '/marketing/segments' },
  { name: 'Analytics', path: '/marketing/analytics' },
] as const;

function MarketingLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();

  // Longer paths win, so /marketing/campaigns/{id} lights up Campaigns and not Overview.
  const active = [...tabs].reverse().find((t) => pathname === t.path || pathname.startsWith(`${t.path}/`));
  const activePath = active?.path ?? '/marketing';

  return (
    <div className="relative flex min-h-full w-full min-w-0 flex-col bg-neutral-xf5f7f5 text-neutral-x2c3531 font-body">
      {/* TOAST NOTIFICATION */}
      <div aria-live="polite" role="status" className="fixed top-4 left-1/2 -translate-x-1/2 z-[80]">
        {toast.show && (
          <div
            className={`px-5 py-3 rounded-modal shadow-raised flex items-center gap-3 border ${
              toast.kind === 'error'
                ? 'bg-danger-50 border-danger-200 text-danger-800'
                : 'bg-brand-rail-deep border-brand-x1f4236 text-neutral-100'
            }`}
          >
            <span className={`font-bold text-sm ${toast.kind === 'error' ? 'text-danger-600' : 'text-brand-400'}`} aria-hidden="true">
              {toast.kind === 'error' ? '!' : '✓'}
            </span>
            <span className="font-medium text-sm tracking-wide">{toast.message}</span>
          </div>
        )}
      </div>

      <div className="sticky top-0 z-40 bg-surface-subtle border-b border-line-soft">
        <ShellTopBar title="Marketing Hub" />

        <nav aria-label="Marketing sections" className="px-4 md:px-8 py-3 bg-surface-subtle">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => {
              const isActive = activePath === tab.path;
              return (
                <Link
                  key={tab.name}
                  href={tab.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-accent-200 text-ink font-bold shadow-card'
                      : 'bg-white border border-line-soft text-ink-muted hover:border-neutral-xc5cfc7'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* MAIN BODY CONTENT */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8 pb-12 flex-1 w-full min-w-0 space-y-6">
        {children}
      </main>
    </div>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <MarketingLayoutContent>{children}</MarketingLayoutContent>
    </ToastProvider>
  );
}
