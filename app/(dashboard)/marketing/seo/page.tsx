'use client';

import React, { useState } from "react";
import { useMarketingApi } from "@/hooks/useMarketingApi";

export default function MarketingSeoPage() {
  const { keywords } = useMarketingApi();
  const [search, setSearch] = useState("");

  const filteredKeywords = keywords.filter(kw => kw.keyword.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          SEO tools
        </h1>
      </div>

      <div className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden flex flex-col">
        <div className="p-4 border-b border-sage-200 bg-sage-50/50 flex justify-end">
          <input 
            type="text"
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 border border-sage-300 rounded focus:outline-none focus:border-sage-500 w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-sage-200 bg-sage-50/50 text-[11px] font-bold text-sage-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Keyword</th>
                <th className="py-3.5 px-6">Volume</th>
                <th className="py-3.5 px-6">Difficulty</th>
                <th className="py-3.5 px-6">Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-100 text-sm">
              {filteredKeywords.map((item, idx) => {
                let diffColor = "text-sage-600";
                if (item.difficulty < 30) diffColor = "text-green-600";
                if (item.difficulty > 60) diffColor = "text-red-600";

                return (
                  <tr key={idx} className="hover:bg-sage-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-sage-900">{item.keyword}</td>
                    <td className="py-4 px-6 text-sage-600">{item.volume}</td>
                    <td className={`py-4 px-6 font-medium ${diffColor}`}>{item.difficulty}</td>
                    <td className="py-4 px-6 font-bold text-green-700">{item.currentRank || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 shadow-card space-y-3">
        <h3 className="text-xs font-bold text-sage-400 uppercase tracking-wider">
          Brand positioning statement
        </h3>
        <p className="text-sm md:text-base text-sage-800 leading-relaxed">
          For <span className="font-semibold text-green-900">gig workers in West Africa</span> who <span className="font-semibold text-green-900">struggle to save on irregular income</span>, <span className="font-semibold text-green-900">Kolo</span> is the <span className="font-semibold text-green-900">savings app</span> that <span className="font-semibold text-green-900">saves for you automatically, without a bank.</span>
        </p>
      </div>
    </div>
  );
}
