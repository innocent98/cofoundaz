'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { AIContentStatus, OpportunityItem, RiskItem } from '@/types/dashboard';
import { safeInternalHref } from '@/lib/safe-href';
import { CardError, CardSkeleton } from './card-states';

export const RISKS_EMPTY_COPY = 'No open risks. I’m watching runway, deadlines, and pipeline for you.';
export const OPPORTUNITIES_EMPTY_COPY = 'Opportunities I spot (grants, quick wins, market signals) will show up here.';

const SEVERITY_DOT: Record<RiskItem['severity'], string> = {
  high: 'bg-danger-xb84335',
  medium: 'bg-warning-500',
  low: 'bg-warning-100 ring-1 ring-warning-500',
};

function Shell({ title, status, busyLabel, children }: { title: string; status: AIContentStatus; busyLabel: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h3 className="font-bold text-base text-ink-deep">{title}</h3>
          {status === 'generating' && (
            <span className="text-xs text-neutral-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent-600 animate-spin" style={{ animationDuration: '3s' }} />
              {busyLabel}
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function Generating() {
  return (
    <div className="space-y-3 py-4">
      <div className="h-3.5 bg-neutral-100 rounded-pill w-4/5 animate-pulse" />
      <div className="h-3.5 bg-neutral-100 rounded-pill w-3/5 animate-pulse" />
    </div>
  );
}

function Row({ dot, text, href, cta }: { dot: string; text: string; href: string | null; cta: string }) {
  return (
    <li className="py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} aria-hidden="true" />
        <p className="text-sm text-neutral-700 leading-snug">{text}</p>
      </div>
      {safeInternalHref(href) ? (
        <Link href={safeInternalHref(href) as string} className="text-xs font-bold text-brand-x266b4e hover:underline shrink-0">
          {cta}
        </Link>
      ) : null}
    </li>
  );
}

export function RisksCard({
  items,
  status,
  loading,
  onRetry,
}: {
  items: RiskItem[];
  status: AIContentStatus | undefined;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) return <CardSkeleton label="Loading Risks" rows={2} />;
  if (!status) return <CardError title="Risks" onRetry={onRetry} />;
  return (
    <Shell title="Risks" status={status} busyLabel="Analyzing">
      {status === 'generating' ? (
        <Generating />
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500 py-6">{RISKS_EMPTY_COPY}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((risk) => (
            <Row key={risk.id} dot={SEVERITY_DOT[risk.severity]} text={risk.description} href={risk.moduleLink} cta="Review" />
          ))}
        </ul>
      )}
    </Shell>
  );
}

export function OpportunitiesCard({
  items,
  status,
  loading,
  onRetry,
}: {
  items: OpportunityItem[];
  status: AIContentStatus | undefined;
  loading: boolean;
  onRetry: () => void;
}) {
  if (loading) return <CardSkeleton label="Loading Opportunities" rows={2} />;
  if (!status) return <CardError title="Opportunities" onRetry={onRetry} />;
  return (
    <Shell title="Opportunities" status={status} busyLabel="Scanning">
      {status === 'generating' ? (
        <Generating />
      ) : items.length === 0 ? (
        <p className="text-sm text-neutral-500 py-6">{OPPORTUNITIES_EMPTY_COPY}</p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((opp) => (
            <Row key={opp.id} dot="bg-success-500" text={opp.description} href={opp.moduleLink} cta="See fit" />
          ))}
        </ul>
      )}
    </Shell>
  );
}
