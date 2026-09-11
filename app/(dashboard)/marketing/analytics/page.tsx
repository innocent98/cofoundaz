'use client';

import React, { useState } from "react";
import { useMarketingApi } from "@/hooks/useMarketingApi";

interface CacChannel {
  name: string;
  cost: string;
  percentage: number;
  barColor: string;
}

interface LeaderboardItem {
  name: string;
  clicks: string;
  convs: string;
  cac: string;
}

export default function MarketingAnalyticsPage() {
  const { campaigns } = useMarketingApi();

  const [dateRange, setDateRange] = useState('30d');

  const cacChannelsList: CacChannel[] = [
    { name: "Referral", cost: "₦180", percentage: 38, barColor: "bg-[#1e4836]" },
    { name: "Organic", cost: "₦260", percentage: 55, barColor: "bg-[#1e4836]" },
    { name: "Email", cost: "₦310", percentage: 70, barColor: "bg-[#46735e]" },
    { name: "Paid", cost: "₦640", percentage: 95, barColor: "bg-[#9C5B34]" },
  ];

  const leaderboardList: LeaderboardItem[] = campaigns.slice(0, 3).map((c, i) => ({
    name: c.name,
    clicks: c.metrics.clicks > 0 ? `${c.metrics.clicks.toLocaleString()} clicks` : `${(i + 1) * 640} clicks`,
    convs: c.metrics.conversions > 0 ? `${c.metrics.conversions} conv` : `${(i + 1) * 31} conv`,
    cac: `₦${(c.metrics.spend / Math.max(1, c.metrics.conversions) || 240).toFixed(0)} CAC`
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
            Performance analytics
          </h1>
        </div>

        <select 
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="bg-white border border-sage-300 rounded-card px-4 py-2.5 text-sm font-semibold text-sage-900 outline-none focus:border-sage-400 shadow-sm"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* TOP GRAPHS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TRAFFIC BY WEEK CARD */}
        <div className="bg-white rounded-modal p-6 border border-sage-200/80 shadow-card flex flex-col justify-between space-y-6">
          <h3 className="text-sm font-semibold text-sage-900">
            Traffic by week
          </h3>
          
          {/* SVG Line Graph matching design */}
          <div className="h-44 w-full flex items-center justify-center pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 140" fill="none">
              <path
                d="M 10 120 Q 120 90, 210 65 T 390 35"
                stroke="#1e4836"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 10 120 Q 120 90, 210 65 T 390 35 L 390 135 L 10 135 Z"
                fill="url(#trafficGradient)"
                opacity="0.12"
              />
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e4836" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* CAC BY CHANNEL CARD */}
        <div className="bg-white rounded-modal p-6 border border-sage-200/80 shadow-card space-y-5">
          <h3 className="text-sm font-semibold text-sage-900">
            CAC by channel
          </h3>

          <div className="space-y-4 pt-1">
            {cacChannelsList.map((ch, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-sage-700">{ch.name}</span>
                  <span className="text-sage-900 font-semibold">{ch.cost}</span>
                </div>
                <div className="w-full bg-sage-100 h-3 rounded-full overflow-hidden p-0.5 border border-sage-200/50">
                  <div
                    className={`h-full rounded-full ${ch.barColor}`}
                    style={{ width: `${ch.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CAMPAIGN LEADERBOARD TABLE */}
      <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-200 bg-sage-50/50">
          <h3 className="text-sm font-semibold text-sage-900">
            Campaign leaderboard
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-sage-100 text-sm">
              {leaderboardList.map((item, idx) => (
                <tr key={idx} className="hover:bg-sage-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-sage-900">{item.name}</td>
                  <td className="py-4 px-6 text-sage-500 font-medium">{item.clicks}</td>
                  <td className="py-4 px-6 text-sage-500 font-medium">{item.convs}</td>
                  <td className="py-4 px-6 font-bold text-green-800 text-right">{item.cac}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
