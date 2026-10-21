'use client';

import React from 'react';
import Link from 'next/link';
import { useContentGapHistory, useMarketingOverview } from '@/hooks/useMarketingApi';
import { CHANNEL_LABELS } from '@/lib/api/marketing';
import { BTN_ACCENT, CARD, DataGate } from '@/components/marketing-hub/states';

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-1">
      <span className="text-[11px] font-bold text-sage-600 tracking-wider uppercase">{label}</span>
      <div className="text-3xl font-display font-bold text-sage-900">{value}</div>
      <p className="text-xs text-sage-500">{note}</p>
    </div>
  );
}

export default function MarketingOverviewPage() {
  const { overview, status, error, reload } = useMarketingOverview();
  const gaps = useContentGapHistory();

  // The newest ready content-gap run supplies "this week's idea". No run yet means no idea.
  const latestGap =
    gaps.history.find((g) => g.status === 'ready' && (g.output.gaps?.length ?? 0) > 0)?.output.gaps?.[0] ?? null;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Marketing Hub
        </h1>
        <p className="text-sage-500 text-sm md:text-base">Plan it, write it, ship it, measure it.</p>
      </div>

      <DataGate status={status} error={error} onRetry={reload} loadingLabel="Loading your marketing overview">
        {overview && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Tile
                label="Scheduled this week"
                value={String(overview.scheduled_this_week)}
                note={overview.scheduled_this_week === 1 ? 'post on the calendar' : 'posts on the calendar'}
              />
              <Tile
                label="Active campaigns"
                value={String(overview.active_campaigns ?? 0)}
                note="currently live"
              />
              <Tile
                label="Top channel"
                value={overview.top_channel_by_conversions ? CHANNEL_LABELS[overview.top_channel_by_conversions] : 'No data yet'}
                note={overview.top_channel_by_conversions ? 'by conversions' : 'appears once conversions are tracked'}
              />
              <Tile
                label="AI content ideas"
                value={String(overview.ai_content_ideas ?? 0)}
                note={(overview.ai_content_ideas ?? 0) > 0 ? 'ready to write' : 'none generated yet'}
              />
            </div>

            <div className="bg-[#0e271f] rounded-modal p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white shadow-card">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-card bg-[#9C5B34] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  ✦
                </div>
                {latestGap ? (
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-lg text-sage-100">This week&apos;s idea</h3>
                    <p className="text-sm text-sage-200 font-medium">{latestGap.title}</p>
                    <p className="text-sm text-sage-300 leading-relaxed">{latestGap.angle}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-lg text-sage-100">No content ideas yet</h3>
                    <p className="text-sm text-sage-300 leading-relaxed">
                      Track a few keywords, then ask the AI which topics you have not covered.
                    </p>
                  </div>
                )}
              </div>

              {latestGap ? (
                <Link
                  href={`/marketing/copy?message=${encodeURIComponent(`${latestGap.title}. ${latestGap.angle}`)}`}
                  className={`${BTN_ACCENT} whitespace-nowrap`}
                >
                  Draft it
                </Link>
              ) : (
                <Link href="/marketing/seo" className={`${BTN_ACCENT} whitespace-nowrap`}>
                  Find ideas
                </Link>
              )}
            </div>

            <div className={`${CARD} p-6 flex flex-wrap gap-3 items-center justify-between`}>
              <p className="text-sm text-sage-600">Jump straight into the work:</p>
              <div className="flex flex-wrap gap-3 text-sm font-semibold">
                <Link className="text-[#0e271f] hover:underline" href="/marketing/calendar">Content calendar</Link>
                <Link className="text-[#0e271f] hover:underline" href="/marketing/campaigns">Campaigns</Link>
                <Link className="text-[#0e271f] hover:underline" href="/marketing/copy">AI copy</Link>
                <Link className="text-[#0e271f] hover:underline" href="/marketing/analytics">Analytics</Link>
              </div>
            </div>
          </>
        )}
      </DataGate>
    </div>
  );
}
