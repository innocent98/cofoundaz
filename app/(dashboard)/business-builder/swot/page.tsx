'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, ArrowDownRight, Target, AlertTriangle } from 'lucide-react';

export default function SwotPage() {
  const [showAiModal, setShowAiModal] = useState(false);
  
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

        <button
          onClick={() => setShowAiModal(true)}
          className="bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2.5 rounded-card text-xs transition-colors flex items-center gap-1.5 border border-[#EAD5C6] shadow-card"
        >
          <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
          <span>Seed each quadrant</span>
        </button>
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

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E2923]/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-modal shadow-raised w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 flex flex-col gap-4">
              <div className="w-12 h-12 bg-[#F5ECDC] rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#8A5330] fill-[#8A5330]" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-[#1E2923]">
                  Seed each quadrant
                </h3>
                <p className="text-sm text-[#617065] mt-2 leading-relaxed">
                  I&apos;ll seed each quadrant using your data.
                </p>
              </div>
            </div>
            <div className="bg-[#FAFAFA] p-4 flex justify-end gap-3 border-t border-[#EBEBE6]">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-sm font-bold text-[#617065] hover:text-[#1E2923] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-sm font-bold text-white bg-[#183B28] hover:bg-[#11291C] rounded-card shadow-sm transition-colors"
              >
                Draft it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
