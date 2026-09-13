'use client';

import React, { useState } from "react";
import { useMarketingApi } from "@/hooks/useMarketingApi";

interface ChannelCard {
  title: string;
  metric: string;
  status: "Active" | "Testing" | "Not started";
  feedback: string;
}

export default function MarketingChannelsPage() {
  const [channelsList, setChannelsList] = useState<ChannelCard[]>([
    {
      title: "Organic social",
      metric: "4.2K reach / mo",
      status: "Active",
      feedback: "Good fit: your audience lives on WhatsApp and Instagram.",
    },
    {
      title: "Referral",
      metric: "₦180 CAC, best channel",
      status: "Active",
      feedback: "High fit: agents already have trust with your users.",
    },
    {
      title: "Paid social",
      metric: "₦640 CAC",
      status: "Testing",
      feedback: "Medium fit: works, but referral is cheaper for now.",
    },
    {
      title: "Content / SEO",
      metric: "Ranking 3 keywords",
      status: "Testing",
      feedback: "High fit: buyers research saving heavily, SEO compounds.",
    },
    {
      title: "Email",
      metric: "38% open rate",
      status: "Active",
      feedback: "Good fit: nurtures your waitlist toward launch.",
    },
    {
      title: "Events",
      metric: "No activity yet",
      status: "Not started",
      feedback: "Low fit for now: revisit at the launch stage.",
    },
  ]);

  const toggleStatus = (idx: number) => {
    setChannelsList(prev => {
      const next = [...prev];
      const current = next[idx].status;
      if (current === 'Active') next[idx].status = 'Testing';
      else if (current === 'Testing') next[idx].status = 'Not started';
      else next[idx].status = 'Active';
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Channels
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {channelsList.map((ch, idx) => {
          let badgeStyle = "bg-green-100 text-green-800";
          if (ch.status === "Testing") badgeStyle = "bg-copper-100 text-copper-800";
          if (ch.status === "Not started") badgeStyle = "bg-sage-100 text-sage-600";

          return (
            <div
              key={idx}
              className="bg-white rounded-modal p-6 border border-sage-200/80 shadow-card flex flex-col justify-between space-y-4 hover:border-sage-300 transition-all cursor-pointer"
              onClick={() => toggleStatus(idx)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg text-sage-900">{ch.title}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeStyle}`}>
                    {ch.status}
                  </span>
                </div>
                <p className="text-xs md:text-sm font-medium text-sage-500">{ch.metric}</p>
              </div>

              <div className="bg-[#f2f6f4] rounded-card p-3.5 flex items-start gap-3 border border-[#e4ece7]">
                <div className="w-5 h-5 rounded-[6px] bg-[#9C5B34] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                  ✦
                </div>
                <p className="text-xs md:text-sm text-[#1e382c] font-medium leading-relaxed">
                  {ch.feedback}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
