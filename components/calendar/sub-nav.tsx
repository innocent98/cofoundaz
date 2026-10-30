'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/calendar', label: 'Calendar' },
  { href: '/calendar/milestones', label: 'Milestones' },
  { href: '/calendar/meetings', label: 'Meetings' },
  { href: '/calendar/reminders', label: 'Reminders' },
  { href: '/calendar/sync', label: 'Sync' },
];

export function CalendarSubNav({ full }: { full: boolean }) {
  const pathname = usePathname() ?? '';
  const tabs = full ? TABS : TABS.filter((t) => t.href === '/calendar/meetings');
  return (
    <nav aria-label="Calendar sections" className="border-b border-line bg-white px-6">
      <ul className="flex gap-6 overflow-x-auto">
        {tabs.map((t) => {
          const active = t.href === '/calendar' ? pathname === '/calendar' : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="shrink-0">
              <Link
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`block py-4 text-sm font-semibold border-b-2 transition-colors ${
                  active ? 'text-brand-strong border-brand-strong' : 'text-ink-muted border-transparent hover:text-brand-strong'
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
