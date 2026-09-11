'use client';

import React from 'react';
import { useAISuggestions } from '../../../../hooks/useAICoFounder';
import { Diamond, Check, TrendingUp } from 'lucide-react';
import type { AgentKey } from '../../../../types/ai';

export default function SuggestedActionsPage() {
  const { suggestions, loading, handleSuggestion } = useAISuggestions();

  const renderIcon = (agentKey: AgentKey) => {
    switch (agentKey) {
      case 'finance':
        return <span className="font-bold text-sm">₦</span>;
      case 'funding':
        return <Diamond className="w-4 h-4 text-[#D89A6E]" />;
      case 'product':
        return <Check className="w-4 h-4 stroke-[3]" />;
      case 'sales':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <span className="font-bold text-sm text-[#D89A6E]">★</span>;
    }
  };

  const agentRoleName = (agentKey: AgentKey) => {
    const roles: Record<AgentKey, string> = {
      cofounder: 'Co-Founder',
      finance: 'Finance Advisor',
      sales: 'Sales Coach',
      marketing: 'Marketing Advisor',
      legal: 'Legal Advisor',
      team: 'Team Mentor',
      product: 'Product Manager',
      funding: 'Fundraising Copilot',
      operations: 'Operations Advisor',
      compliance: 'Compliance Officer',
      analytics: 'Data Analyst'
    };
    return roles[agentKey] || 'Advisor';
  };

  return (
    <div className="max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1E2923] tracking-tight mb-1">
          Suggested actions
        </h2>
        <p className="text-xs text-[#617065]">
          Proactive ideas based on your recent activity and metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-sm text-sage-500">Loading suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-sage-500">Nothing right now. When I spot something worth your time, it'll be here.</p>
        ) : (
          suggestions.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col justify-between hover:border-[#1E4D3B] transition-colors group"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-[#183B28] text-white flex items-center justify-center shrink-0">
                    {renderIcon(item.agentKey)}
                  </div>
                  <span className="text-[11px] font-semibold text-[#617065]">
                    {agentRoleName(item.agentKey)}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#1E2923] leading-tight mb-2">
                  {item.suggestion}
                </h3>
                <p className="text-xs text-[#556358] leading-relaxed mb-6">
                  {item.rationale}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleSuggestion(item.id, 'accept')}
                  className="flex-1 bg-white hover:bg-[#F5F5F0] text-[#183B28] font-semibold text-[11px] py-1.5 px-3 rounded-card border border-[#D5DDD6] transition-colors"
                >
                  Do it
                </button>
                <button
                  onClick={() => handleSuggestion(item.id, 'snooze')}
                  className="flex-1 bg-white hover:bg-[#F5F5F0] text-[#617065] font-medium text-[11px] py-1.5 px-3 rounded-card border border-[#EBEBE6] transition-colors"
                >
                  Snooze 1 week
                </button>
                <button
                  onClick={() => handleSuggestion(item.id, 'dismiss')}
                  className="flex-1 bg-white hover:bg-[#FFF5F5] text-[#B84233] font-medium text-[11px] py-1.5 px-3 rounded-card border border-[#EBEBE6] hover:border-[#F6D0D0] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
