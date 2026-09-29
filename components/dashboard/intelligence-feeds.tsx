'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { DashboardErrorBoundary } from './error-boundary';
import type { RiskItem, OpportunityItem, AIContentStatus } from '@/types/dashboard';

export function IntelligenceFeeds({
  risks,
  opportunities,
  risksStatus = 'empty',
  opportunitiesStatus = 'empty',
  onRefetch
}: {
  risks: RiskItem[];
  opportunities: OpportunityItem[];
  risksStatus?: AIContentStatus;
  opportunitiesStatus?: AIContentStatus;
  onRefetch: () => void;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full col-span-1 md:col-span-12">
      {/* Risks */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <div className="col-span-1 md:col-span-6 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-sage-900">Risks</h3>
              {risksStatus === 'generating' && (
                <span className="flex items-center gap-1.5 text-xs text-sage-500">
                  <Sparkles className="w-3.5 h-3.5 text-copper-600 animate-spin" style={{ animationDuration: '3s' }} />
                  Analyzing
                </span>
              )}
            </div>

            {risksStatus === 'generating' ? (
              <div className="space-y-3 py-2">
                <div className="h-3.5 bg-sage-100 rounded-pill w-4/5 animate-pulse" />
                <div className="h-3.5 bg-sage-100 rounded-pill w-3/5 animate-pulse" />
              </div>
            ) : risks.length === 0 ? (
              <p className="text-sm text-sage-500 py-4">
                No open risks. I&apos;m watching runway, deadlines, and pipeline for you.
              </p>
            ) : (
              <ul className="space-y-3">
                {risks.map((risk) => (
                  <li key={risk.id} className="flex items-center justify-between py-2 border-b border-sage-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${risk.severity === 'high' || risk.severity === 'red' ? 'bg-red-600' : 'bg-copper-600'}`} />
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
        </div>
      </DashboardErrorBoundary>

      {/* Opportunities */}
      <DashboardErrorBoundary onRetry={onRefetch}>
        <div className="col-span-1 md:col-span-6 bg-white p-6 rounded-card border border-sage-100 shadow-card flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-sage-900">Opportunities</h3>
              {opportunitiesStatus === 'generating' && (
                <span className="flex items-center gap-1.5 text-xs text-sage-500">
                  <Sparkles className="w-3.5 h-3.5 text-copper-600 animate-spin" style={{ animationDuration: '3s' }} />
                  Scanning
                </span>
              )}
            </div>

            {opportunitiesStatus === 'generating' ? (
              <div className="space-y-3 py-2">
                <div className="h-3.5 bg-sage-100 rounded-pill w-4/5 animate-pulse" />
                <div className="h-3.5 bg-sage-100 rounded-pill w-3/5 animate-pulse" />
              </div>
            ) : opportunities.length === 0 ? (
              <p className="text-sm text-sage-500 py-4">
                Opportunities I spot — grants, quick wins, market signals — will show up here.
              </p>
            ) : (
              <ul className="space-y-3">
                {opportunities.map((opp) => (
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
        </div>
      </DashboardErrorBoundary>
    </section>
  );
}
