'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { HelpTab } from '@/components/settings/help-tab';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/components/sidebar-context';

export default function DeepLinkedTicketPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();
  const params = useParams();
  const ticketId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : null;

  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased">
      <header className="sticky top-0 z-40 border-b border-line px-4 md:px-8 py-3.5 flex items-center justify-between bg-white w-full">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={openSidebar}
            className="lg:hidden w-9 h-9 rounded-modal border border-line-stone bg-white text-brand-strong hover:bg-neutral-50 flex items-center justify-center shrink-0 shadow-card cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <h1 className="text-sm md:text-base font-semibold tracking-tight truncate">
            <span className="text-ink-muted font-normal">Settings</span>
            <span className="text-ink-subtle font-normal"> / </span>
            <span className="text-ink-muted font-normal">Help</span>
            <span className="text-ink-subtle font-normal"> / </span>
            Ticket
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <HelpTab initialTicketId={ticketId} />
      </div>
    </div>
  );
}

