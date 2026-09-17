'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAICoFounder } from '../../../../hooks/useAICoFounder';
import { 
  PieChart, 
  TrendingUp, 
  Diamond, 
  Star, 
  Check, 
  ArrowRight, 
  Sun, 
  Layers 
} from 'lucide-react';
import type { AgentKey } from '@/types/ai';

interface BenchAgent {
  id: string;
  key: AgentKey;
  name: string;
  category: string;
  description: string;
  buttonText: string;
  iconType: string;
}

const benchAgents: BenchAgent[] = [
  {
    id: '1', key: 'cofounder', name: 'Strategist', category: 'Business Builder',
    description: 'Sharpens your model, plan, and positioning.',
    buttonText: 'Ask Strategist', iconType: 'lines'
  },
  {
    id: '2', key: 'finance', name: 'Finance Advisor', category: 'Finance Hub',
    description: 'Runway, forecasts, and the hard money calls.',
    buttonText: 'Ask Finance', iconType: 'currency'
  },
  {
    id: '3', key: 'legal', name: 'Legal Advisor', category: 'Legal & Compliance',
    description: 'Contracts, formation, and staying covered.',
    buttonText: 'Ask Legal', iconType: 'section'
  },
  {
    id: '4', key: 'marketing', name: 'Marketing Advisor', category: 'Marketing Hub',
    description: 'Campaigns, copy, and channel strategy.',
    buttonText: 'Ask Marketing', iconType: 'pie'
  },
  {
    id: '5', key: 'sales', name: 'Sales Coach', category: 'Sales Hub',
    description: 'Pipeline, objections, and closing with confidence.',
    buttonText: 'Ask Sales', iconType: 'trending'
  },
  {
    id: '6', key: 'funding', name: 'Fundraising Copilot', category: 'Funding Hub',
    description: 'Investors, the data room, and running the raise.',
    buttonText: 'Ask Fundraising', iconType: 'diamond'
  },
  {
    id: '7', key: 'cofounder', name: 'Readiness Coach', category: 'Investor Readiness',
    description: 'Your deck, your story, and the tough questions.',
    buttonText: 'Ask Readiness', iconType: 'star'
  },
  {
    id: '8', key: 'product', name: 'Validation Scientist', category: 'Validation Hub',
    description: 'Experiments that prove it before you build.',
    buttonText: 'Ask Validation', iconType: 'check'
  },
  {
    id: '9', key: 'product', name: 'Product Manager', category: 'Roadmap',
    description: 'Turns feedback into the right next build.',
    buttonText: 'Ask Product', iconType: 'arrow'
  },
  {
    id: '10', key: 'analytics', name: 'Insight Synthesizer', category: 'Validation Hub',
    description: 'Finds the patterns hiding in your feedback.',
    buttonText: 'Ask Insight', iconType: 'layers'
  },
  {
    id: '11', key: 'team', name: 'Mentor', category: 'Across everything',
    description: 'A steady voice for the founder behind the company.',
    buttonText: 'Ask Mentor', iconType: 'sun'
  }
];

export default function AgentsPage() {
  const router = useRouter();

  const renderBenchIcon = (type: string) => {
    switch (type) {
      case 'lines': return (
        <div className="flex flex-col gap-1 w-3.5 items-center">
          <div className="w-full h-0.5 bg-white/80 rounded-full" />
          <div className="w-full h-0.5 bg-white/80 rounded-full" />
          <div className="w-full h-0.5 bg-white/80 rounded-full" />
        </div>
      );
      case 'currency': return <span className="font-bold text-sm text-[#D89A6E]">₦</span>;
      case 'section': return <span className="font-display text-sm font-bold text-[#D89A6E]">§</span>;
      case 'pie': return <PieChart className="w-4 h-4 text-[#D89A6E]" />;
      case 'trending': return <TrendingUp className="w-4 h-4 text-[#D89A6E]" />;
      case 'diamond': return <Diamond className="w-4 h-4 text-[#D89A6E]" />;
      case 'star': return <Star className="w-4 h-4 text-[#D89A6E] fill-[#D89A6E]" />;
      case 'check': return <Check className="w-4 h-4 stroke-[3] text-white" />;
      case 'arrow': return <ArrowRight className="w-4 h-4 text-[#D89A6E]" />;
      case 'layers': return <Layers className="w-4 h-4 text-[#D89A6E]" />;
      case 'sun': return <Sun className="w-4 h-4 text-[#D89A6E]" />;
      default: return null;
    }
  };

  const handleAskAgent = async (agent: BenchAgent) => {
    // We pass the selected agent via URL query parameter
    router.push(`/ai?agent=${agent.key}`);
  };

  return (
    <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1E2923] tracking-tight mb-1">
          Your bench
        </h2>
        <p className="text-xs text-[#617065]">
          Every specialist, one chat away. You never have to pick, I route automatically, but you can go direct.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {benchAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-modal p-5 border border-[#EBEBE6] shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-card bg-[#183B28] text-white flex items-center justify-center shrink-0">
                  {renderBenchIcon(agent.iconType)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#1E2923] leading-tight">
                    {agent.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-[#9C5B34]">
                    {agent.category}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#556358] leading-relaxed mb-6">
                {agent.description}
              </p>
            </div>
            <button
              onClick={() => handleAskAgent(agent)}
              className="w-full bg-white hover:bg-[#F5F5F0] text-[#183B28] font-semibold text-xs py-2 rounded-card border border-[#D5DDD6] transition-colors"
            >
              {agent.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
