/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React from "react";
import { useMarketingApi } from "@/hooks/useMarketingApi";
import { useRouter } from "next/navigation";

export default function MarketingOverviewPage() {
  const { campaigns, calendar } = useMarketingApi();
  const router = useRouter();

  const scheduledCount = calendar.filter((e: any) => e.status === 'scheduled').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Marketing Hub
        </h1>
        <p className="text-sage-500 text-sm md:text-base">
          Plan it, write it, ship it, measure it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-bold text-sage-400 tracking-wider uppercase">
            SCHEDULED THIS WEEK
          </span>
          <div className="text-3xl font-display font-bold text-sage-900">{scheduledCount}</div>
          <p className="text-xs text-sage-500">posts across 3 channels</p>
        </div>
        <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-bold text-sage-400 tracking-wider uppercase">
            ACTIVE CAMPAIGNS
          </span>
          <div className="text-3xl font-display font-bold text-sage-900">{activeCampaigns}</div>
          <p className="text-xs text-sage-500">WhatsApp + referral</p>
        </div>
        <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-bold text-sage-400 tracking-wider uppercase">
            TOP CHANNEL
          </span>
          <div className="text-3xl font-display font-bold text-sage-900">Referral</div>
          <p className="text-xs text-sage-500">by conversions</p>
        </div>
        <div className="bg-white p-6 rounded-modal border border-sage-200/80 shadow-card space-y-1">
          <span className="text-[11px] font-bold text-sage-400 tracking-wider uppercase">
            AI CONTENT IDEAS
          </span>
          <div className="text-3xl font-display font-bold text-sage-900">4</div>
          <p className="text-xs text-sage-500">waiting for you</p>
        </div>
      </div>

      <div className="bg-[#0e271f] rounded-modal p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white shadow-card">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-card bg-[#9C5B34] text-white flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
            ✦
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-lg text-sage-100">
              This week&apos;s idea
            </h3>
            <p className="text-sm text-sage-300 leading-relaxed">
              A short WhatsApp thread on “the ajo box problem” would fit your audience and your trust theme.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/marketing/copy')}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-semibold px-5 py-2.5 rounded-card text-sm transition-all cursor-pointer whitespace-nowrap shadow-card"
        >
          Draft it
        </button>
      </div>
    </div>
  );
}
