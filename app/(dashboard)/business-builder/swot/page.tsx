'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Target, AlertTriangle } from 'lucide-react';
import { AiDraftButton } from '@/components/business-builder/ai-draft-button';

export default function SwotPage() {
  const swotData = [
    {
      id: 'strengths',
      title: 'Strengths',
      icon: <ArrowUpRight className="w-4 h-4" />,
      bgColor: 'bg-[#F2F7F4]',
      borderColor: 'border-[#D5E3DB]',
      titleColor: 'text-[#183B28]',
      dotColor: 'bg-[#183B28]',
      items: [
        'Agent network trust',
        'Low customer acquisition cost',
        'No smartphone required',
      ],
    },
    {
      id: 'weaknesses',
      title: 'Weaknesses',
      icon: <ArrowDownRight className="w-4 h-4" />,
      bgColor: 'bg-[#FAF4F0]',
      borderColor: 'border-[#EAD5C6]',
      titleColor: 'text-[#8A5330]',
      dotColor: 'bg-[#8A5330]',
      items: [
        'High cash handling costs',
        'Regulatory capital requirements',
        'Low revenue per user',
      ],
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      icon: <Target className="w-4 h-4" />,
      bgColor: 'bg-[#F4F6FB]',
      borderColor: 'border-[#D5DBE8]',
      titleColor: 'text-[#3D527D]',
      dotColor: 'bg-[#3D527D]',
      items: [
        'Huge unbanked market',
        'Grant funding available',
        'Partner distribution',
      ],
    },
    {
      id: 'threats',
      title: 'Threats',
      icon: <AlertTriangle className="w-4 h-4" />,
      bgColor: 'bg-[#FDF2F2]',
      borderColor: 'border-[#F4C7C7]',
      titleColor: 'text-[#A34B4B]',
      dotColor: 'bg-[#A34B4B]',
      items: [
        'Well-funded incumbents',
        'Regulatory shifts',
        'Trust is fragile',
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          SWOT
        </h2>

        {/* Honest AI-fill: enqueues the real (deferred) job; no fake results. */}
        <AiDraftButton canvasType="swot" label="Seed with AI" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {swotData.map((quad) => (
          <div
            key={quad.id}
            className={`${quad.bgColor} ${quad.borderColor} rounded-modal p-6 border shadow-card flex flex-col gap-4 min-h-[190px]`}
          >
            <div className="flex items-center gap-2">
              <span className={quad.titleColor}>{quad.icon}</span>
              <h3 className={`text-base font-bold ${quad.titleColor}`}>
                {quad.title}
              </h3>
            </div>

            <ul className="flex flex-col gap-3 pt-1">
              {quad.items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2.5 text-xs md:text-sm text-[#2D3830] font-medium"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${quad.dotColor} shrink-0`}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
