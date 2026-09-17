'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useToast } from '../layout';

export default function RevenueModelPage() {
  const { triggerToast } = useToast();
  
  const revenueStreams = [
    { id: 'sub', stream: 'Core Subscription', basis: '₦500/mo flat fee', estMonthly: '₦2.5M' },
    { id: 'float', stream: 'Float Interest', basis: '3% spread on pooled AUM', estMonthly: '₦800K' },
    { id: 'b2b', stream: 'B2B API access', basis: 'Per API call (future)', estMonthly: '₦0' },
  ];

  const monthlyProjectionData = [18, 26, 32, 38, 46, 54, 60, 68, 74, 82, 88, 100];

  const handleSendToFinancialModel = () => {
    triggerToast('Assumptions sent to your financial model.');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Revenue model
        </h2>

        <button
          onClick={handleSendToFinancialModel}
          className="bg-[#9C5B34] hover:bg-[#8A5330] text-white font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 shadow-card"
        >
          <span>Send to financial model</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                  STREAM
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                  BASIS
                </th>
                <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                  EST. MONTHLY
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0EC]">
              {revenueStreams.map((row) => (
                <tr key={row.id} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">
                    {row.stream}
                  </td>
                  <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">
                    {row.basis}
                  </td>
                  <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#183B28]">
                    {row.estMonthly}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
        <h3 className="text-xs font-bold text-[#1E2923]">
          12-month projection
        </h3>

        <div className="h-48 flex items-end justify-between gap-2.5 md:gap-4 pt-4 px-2">
          {monthlyProjectionData.map((heightPct, index) => (
            <div
              key={index}
              className="flex-1 bg-[#235840] hover:bg-[#183B28] transition-colors rounded-xs md:rounded-[2px]"
              style={{ height: `${heightPct}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
