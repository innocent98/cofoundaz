'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardErrorBoundary } from './error-boundary';
import type { RiskItem, OpportunityItem } from '@/types/dashboard';

export function IntelligenceFeeds({
  risks,
  opportunities,
  onRefetch
}: {
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  onRefetch: () => void;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full col-span-1 md:col-span-12">
      {/* Risks */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <div className="col-span-1 md:col-span-6 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col">
          <h3 className="font-bold text-base text-sage-900 mb-4">Risks</h3>
          {risks.length === 0 ? (
            <p className="text-sm text-sage-500 py-4">
              No open risks. I&apos;m watching runway, deadlines, and pipeline for you.
            </p>
          ) : (
            <ul className="space-y-3">
              {risks.map(risk => (
                <li key={risk.id} className="flex items-center justify-between py-2 border-b border-sage-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${risk.severity === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <p className="text-sm text-sage-700 leading-snug">{risk.description}</p>
                  </div>
                  <Link href={risk.moduleLink || '#'} className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardErrorBoundary>

      {/* Opportunities */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <div className="col-span-1 md:col-span-6 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col">
          <h3 className="font-bold text-base text-sage-900 mb-4">Opportunities</h3>
          {opportunities.length === 0 ? (
            <p className="text-sm text-sage-500 py-4">
              Opportunities I spot — grants, quick wins, market signals — will show up here.
            </p>
          ) : (
            <ul className="space-y-3">
              {opportunities.map(opp => (
                <li key={opp.id} className="flex items-center justify-between py-2 border-b border-sage-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-[#266B4E]" />
                    <p className="text-sm text-sage-700 leading-snug">{opp.description}</p>
                  </div>
                  <Link href={opp.moduleLink || '#'} className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    See fit
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardErrorBoundary>
    </section>
  );
}
