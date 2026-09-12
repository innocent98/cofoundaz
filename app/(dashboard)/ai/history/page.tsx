'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useAICoFounder } from '../../../../hooks/useAICoFounder';

export default function HistoryPage() {
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const { conversations } = useAICoFounder();
  const loading = false; // mock local state hook doesn't have loading indicator

  const filteredHistory = conversations.filter(
    (item) =>
      item.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      (item.topic && item.topic.toLowerCase().includes(historySearchQuery.toLowerCase())) ||
      item.agentsInvolved.some(a => a.toLowerCase().includes(historySearchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
      {/* Header section with search */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1E2923] tracking-tight mb-1">
            Conversation history
          </h2>
          <p className="text-xs text-[#617065]">
            Everything you&apos;ve worked through, grouped by topic.
          </p>
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E9B90]" />
          <input
            type="text"
            value={historySearchQuery}
            onChange={(e) => setHistorySearchQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-white text-xs text-[#1E2923] placeholder-[#8E9B90] pl-9 pr-3 py-2 rounded-card border border-[#EBEBE6] focus:border-[#9C5B34] focus:outline-none transition-colors shadow-card"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F8F4] border-b border-[#EBEBE6] text-[11px] font-bold uppercase tracking-wider text-[#768478]">
                <th className="py-3.5 px-6">CONVERSATION</th>
                <th className="py-3.5 px-6">TOPIC</th>
                <th className="py-3.5 px-6">AGENTS</th>
                <th className="py-3.5 px-6">LAST ACTIVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBE6]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-sage-500">Loading...</td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-sage-500">No conversations found.</td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-[#FBFBFA] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm font-semibold text-[#1E2923] group-hover:text-[#9C5B34] transition-colors">
                      {item.title}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBEBE6] text-[#617065]">
                        {item.topic || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-[#617065]">
                      {item.agentsInvolved.join(', ')}
                    </td>
                    <td className="py-4 px-6 text-xs text-[#8E9B90]">
                      {new Date(item.lastMessageAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
