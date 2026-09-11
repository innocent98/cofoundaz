'use client';

import React from 'react';

export default function CompetitiveAnalysisPage() {
  const competitors = [
    { id: 'cowrywise', name: 'Cowrywise', positioning: 'Millennial wealth management', threat: 'High' },
    { id: 'piggyvest', name: 'PiggyVest', positioning: 'Digital savings & investment', threat: 'High' },
    { id: 'banks', name: 'Traditional Banks', positioning: 'Legacy trust, slow tech', threat: 'Medium' },
    { id: 'ajo', name: 'Local Ajo / Esusu', positioning: 'Offline community trust', threat: 'Medium' },
  ];

  const getThreatBadgeStyle = (threat: string) => {
    switch (threat) {
      case 'High':
        return 'bg-[#FBEBEB] text-[#B83E3E]';
      case 'Medium':
        return 'bg-[#F7EFE0] text-[#9C5B34]';
      case 'Low':
        return 'bg-[#EBF5F0] text-[#2E7A56]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          Competitive analysis
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[420px]">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#EBEBE6]">
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                    COMPETITOR
                  </th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                    POSITIONING
                  </th>
                  <th className="py-3.5 px-6 text-[11px] font-bold tracking-wider text-[#768478] uppercase w-1/3">
                    THREAT
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EC]">
                {competitors.map((comp) => (
                  <tr key={comp.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-4 px-6 text-xs md:text-sm font-bold text-[#1E2923]">
                      {comp.name}
                    </td>
                    <td className="py-4 px-6 text-xs md:text-sm text-[#556358]">
                      {comp.positioning}
                    </td>
                    <td className="py-4 px-6 text-xs md:text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getThreatBadgeStyle(
                          comp.threat
                        )}`}
                      >
                        {comp.threat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-4">
          <h3 className="text-xs font-bold text-[#1E2923]">
            Positioning map
          </h3>

          <div className="relative w-full h-64 border-l border-b border-[#A0AABA] mt-2 mb-2">
            <span className="absolute top-0 left-2 text-[10px] font-medium text-[#556358]">
              High trust
            </span>
            <span className="absolute bottom-1 right-2 text-[10px] font-medium text-[#556358]">
              Low cost →
            </span>

            <div className="absolute top-[38%] left-[20%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#75B29B] border-2 border-white shadow-card" />
              <span className="text-[10px] font-bold text-[#1E2923] mt-1">Banks</span>
            </div>

            <div className="absolute top-[62%] left-[45%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#3B7A57] border-2 border-white shadow-card" />
              <span className="text-[10px] font-bold text-[#1E2923] mt-1">Cowrywise</span>
            </div>

            <div className="absolute top-[46%] left-[52%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#1A422D] border-2 border-white shadow-card" />
              <span className="text-[10px] font-bold text-[#1E2923] mt-1">PiggyVest</span>
            </div>

            <div className="absolute top-[30%] left-[82%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 rounded-full bg-[#9C5B34] border-2 border-white shadow-card" />
              <span className="text-[10px] font-bold text-[#1E2923] mt-1">Kolo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
